import { Service } from '@/core/container';
import { SimulatedTerminal, TerminalInfo, TerminalSession } from '@/types/websocket';
import { logger } from '@/utils/logger';
import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';

@Service('TerminalService')
export class TerminalService {
  private terminals = new Map<string, TerminalSession>();
  private userTerminals = new Map<number, Set<string>>(); // userId -> Set of terminalIds
  private isNodePtyAvailable = false;
  private pty: any = null;

  constructor() {
    this.initializePty();
  }

  /**
   * Initialize node-pty if available, otherwise use simulation
   */
  private initializePty(): void {
    try {
      this.pty = require('node-pty');
      this.isNodePtyAvailable = true;
      logger.info('✅ node-pty loaded successfully - real terminal support enabled');
    } catch (error) {
      this.isNodePtyAvailable = false;
      logger.warn('⚠️ node-pty not available - using simulated terminal', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a new terminal session
   */
  async createTerminal(
    options: {
      cols?: number;
      rows?: number;
      shell?: string;
      userId?: number;
      userName?: string;
    } = {}
  ): Promise<TerminalSession> {
    const terminalId = this.generateTerminalId();
    const { cols = 80, rows = 24, shell = this.getDefaultShell(), userId, userName } = options;

    // Create properly typed options for child methods
    const terminalOptions = {
      cols,
      rows,
      shell,
      ...(userId !== undefined && { userId }),
      ...(userName !== undefined && { userName }),
    };

    let terminal: TerminalSession;

    if (this.isNodePtyAvailable && this.pty) {
      // Create real terminal using node-pty
      terminal = await this.createRealTerminal(terminalId, terminalOptions);
    } else {
      // Create simulated terminal
      terminal = this.createSimulatedTerminal(terminalId, terminalOptions);
    }

    this.terminals.set(terminalId, terminal);

    // Track user terminals
    if (userId) {
      if (!this.userTerminals.has(userId)) {
        this.userTerminals.set(userId, new Set());
      }
      this.userTerminals.get(userId)!.add(terminalId);
    }

    logger.info('Terminal created', {
      terminalId,
      userId,
      shell,
      cols,
      rows,
      type: this.isNodePtyAvailable ? 'real' : 'simulated',
    });

    return terminal;
  }

  /**
   * Create real terminal using node-pty
   */
  private async createRealTerminal(
    terminalId: string,
    options: {
      cols: number;
      rows: number;
      shell: string;
      userId?: number;
      userName?: string;
    }
  ): Promise<TerminalSession> {
    const { cols, rows, shell, userId, userName } = options;

    try {
      const ptyProcess = this.pty.spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.env.HOME || os.homedir(),
        env: process.env,
      });

      const terminal: TerminalSession = {
        id: terminalId,
        process: ptyProcess,
        shell,
        cols,
        rows,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'running',
        ...(userId !== undefined && { userId }),
        ...(userName !== undefined && { userName }),
      };

      return terminal;
    } catch (error) {
      logger.error('Failed to create real terminal', {
        terminalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to simulated terminal
      return this.createSimulatedTerminal(terminalId, options);
    }
  }

  /**
   * Create simulated terminal
   */
  private createSimulatedTerminal(
    terminalId: string,
    options: {
      cols: number;
      rows: number;
      shell: string;
      userId?: number;
      userName?: string;
    }
  ): TerminalSession {
    const { cols, rows, shell, userId, userName } = options;

    // Create safe environment object
    const environment: Record<string, string> = {};
    if (process.env) {
      Object.entries(process.env).forEach(([key, value]) => {
        if (value !== undefined) {
          environment[key] = value;
        }
      });
    }

    const simulatedProcess: SimulatedTerminal = {
      id: terminalId,
      currentDirectory: process.env.HOME || os.homedir(),
      environment,
      history: [],
      commandCounter: 0,
    };

    const terminal: TerminalSession = {
      id: terminalId,
      shell,
      cols,
      rows,
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'running',
      simulatedProcess,
      ...(userId !== undefined && { userId }),
      ...(userName !== undefined && { userName }),
    };

    return terminal;
  }

  /**
   * Write input to terminal
   */
  async writeToTerminal(terminalId: string, input: string): Promise<string | null> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return null;
    }

    terminal.lastActivity = new Date();

    if (terminal.process && this.isNodePtyAvailable) {
      // Write to real terminal
      terminal.process.write(input);
      return null; // Data will come through onData event
    } else if (terminal.simulatedProcess) {
      // Handle simulated terminal input
      return this.handleSimulatedInput(terminal.simulatedProcess, input);
    }

    return null;
  }

  /**
   * Handle simulated terminal input and generate response
   */
  private handleSimulatedInput(simulated: SimulatedTerminal, input: string): string {
    // Handle special characters
    if (input === '\r' || input === '\n') {
      const command = simulated.history[simulated.history.length - 1] || '';
      const output = this.executeSimulatedCommand(simulated, command);
      simulated.history.push('');
      simulated.commandCounter++;
      return output + this.getPrompt(simulated);
    }

    // Handle backspace
    if (input === '\b' || input === '\x7f') {
      if (simulated.history.length > 0) {
        const lastCommand = simulated.history[simulated.history.length - 1];
        if (lastCommand && lastCommand.length > 0) {
          simulated.history[simulated.history.length - 1] = lastCommand.slice(0, -1);
          return '\b \b'; // Backspace, space, backspace
        }
      }
      return '';
    }

    // Add to current command
    if (simulated.history.length === 0) {
      simulated.history.push(input);
    } else {
      simulated.history[simulated.history.length - 1] += input;
    }

    return input; // Echo the input
  }

  /**
   * Execute simulated command and return output
   */
  private executeSimulatedCommand(simulated: SimulatedTerminal, command: string): string {
    const cmd = command.trim();

    if (!cmd) {
      return '\r\n';
    }

    // Basic command simulation
    switch (cmd.split(' ')[0]) {
      case 'pwd':
        return `\r\n${simulated.currentDirectory}\r\n`;

      case 'ls':
        return '\r\nDocuments  Downloads  Desktop  Pictures  Music  Videos\r\n';

      case 'whoami':
        return `\r\n${simulated.environment.USER || 'user'}\r\n`;

      case 'date':
        return `\r\n${new Date().toString()}\r\n`;

      case 'echo':
        const echoText = cmd.substring(5);
        return `\r\n${echoText}\r\n`;

      case 'clear':
        return '\x1b[2J\x1b[H'; // Clear screen and move cursor to top

      case 'help':
        return '\r\nAvailable commands: pwd, ls, whoami, date, echo, clear, help, exit\r\n';

      case 'exit':
        return '\r\nSession ended.\r\n';

      default:
        return `\r\nbash: ${cmd}: command not found\r\n`;
    }
  }

  /**
   * Get shell prompt
   */
  private getPrompt(simulated: SimulatedTerminal): string {
    const user = simulated.environment.USER || 'user';
    const hostname = simulated.environment.HOSTNAME || 'localhost';
    const currentDir = path.basename(simulated.currentDirectory);
    return `${user}@${hostname}:${currentDir}$ `;
  }

  /**
   * Resize terminal
   */
  async resizeTerminal(terminalId: string, cols: number, rows: number): Promise<boolean> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.cols = cols;
    terminal.rows = rows;
    terminal.lastActivity = new Date();

    if (terminal.process && this.isNodePtyAvailable) {
      try {
        terminal.process.resize(cols, rows);
        return true;
      } catch (error) {
        logger.error('Failed to resize terminal', {
          terminalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // For simulated terminals, just update the size
    return true;
  }

  /**
   * Destroy terminal session
   */
  async destroyTerminal(terminalId: string): Promise<boolean> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    try {
      if (terminal.process && this.isNodePtyAvailable) {
        terminal.process.kill();
      }

      terminal.status = 'stopped';

      // Remove from user terminals tracking
      if (terminal.userId) {
        const userTerminalSet = this.userTerminals.get(terminal.userId);
        if (userTerminalSet) {
          userTerminalSet.delete(terminalId);
          if (userTerminalSet.size === 0) {
            this.userTerminals.delete(terminal.userId);
          }
        }
      }

      this.terminals.delete(terminalId);

      logger.info('Terminal destroyed', {
        terminalId,
        userId: terminal.userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to destroy terminal', {
        terminalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get terminal by ID
   */
  getTerminal(terminalId: string): TerminalSession | undefined {
    return this.terminals.get(terminalId);
  }

  /**
   * Get all terminals for a user
   */
  getUserTerminals(userId: number): TerminalSession[] {
    const terminalIds = this.userTerminals.get(userId);
    if (!terminalIds) {
      return [];
    }

    return Array.from(terminalIds)
      .map(id => this.terminals.get(id))
      .filter(terminal => terminal !== undefined) as TerminalSession[];
  }

  /**
   * Get all terminals info
   */
  getAllTerminals(): TerminalInfo[] {
    return Array.from(this.terminals.values()).map(terminal => ({
      id: terminal.id,
      pid: terminal.process?.pid,
      shell: terminal.shell,
      cols: terminal.cols,
      rows: terminal.rows,
      createdAt: terminal.createdAt,
      status: terminal.status,
      ...(terminal.userId !== undefined && { userId: terminal.userId }),
      ...(terminal.userName !== undefined && { userName: terminal.userName }),
    }));
  }

  /**
   * Setup terminal data handler for real terminals
   */
  setupTerminalDataHandler(terminalId: string, onData: (data: string) => void): void {
    const terminal = this.terminals.get(terminalId);
    if (!terminal || !terminal.process || !this.isNodePtyAvailable) {
      return;
    }

    terminal.process.onData((data: string) => {
      terminal.lastActivity = new Date();
      onData(data);
    });

    terminal.process.onExit((exitCode: number, signal: number) => {
      logger.info('Terminal process exited', {
        terminalId,
        exitCode,
        signal,
      });
      terminal.status = 'stopped';
      onData(`\r\n[Process completed with exit code ${exitCode}]\r\n`);
    });
  }

  /**
   * Generate unique terminal ID
   */
  private generateTerminalId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get default shell for the platform
   */
  private getDefaultShell(): string {
    if (os.platform() === 'win32') {
      return process.env.COMSPEC || 'powershell.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  /**
   * Get initial welcome message for simulated terminal
   */
  getWelcomeMessage(terminalId: string): string {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return '';
    }

    if (terminal.simulatedProcess) {
      const prompt = this.getPrompt(terminal.simulatedProcess);
      return `Welcome to simulated terminal!\r\nType 'help' for available commands.\r\n\r\n${prompt}`;
    }

    return '';
  }

  /**
   * Cleanup inactive terminals
   */
  cleanupInactiveTerminals(maxIdleTime: number = 30 * 60 * 1000): void {
    const now = new Date();
    const terminalsToCleanup: string[] = [];

    for (const [terminalId, terminal] of this.terminals) {
      const timeSinceLastActivity = now.getTime() - terminal.lastActivity.getTime();
      if (timeSinceLastActivity > maxIdleTime) {
        terminalsToCleanup.push(terminalId);
      }
    }

    for (const terminalId of terminalsToCleanup) {
      this.destroyTerminal(terminalId);
      logger.info('Terminal cleaned up due to inactivity', { terminalId });
    }
  }
}
