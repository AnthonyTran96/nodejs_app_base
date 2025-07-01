# 📦 Module Registry System Guide

## 🎯 Purpose

The Module Registry system is designed to:
- ✅ **Reduce conflicts** when multiple developers add services
- ✅ **Organize code** by separate modules
- ✅ **Auto-register** dependency injection
- ✅ **Easy to maintain** and extend

## 🏗️ System Architecture

```
src/
├── core/
│   ├── module-registry.ts    # 🔧 Core registry system
│   ├── core.registry.ts      # 🏛️ Core services (UnitOfWork, etc.)
│   ├── container-setup.ts    # 🎯 Main setup (import modules only)
│   └── template.registry.ts.example # 📝 Template for new modules
├── modules/
│   ├── user/
│   │   └── user.registry.ts  # 👤 User module registration
│   ├── auth/
│   │   └── auth.registry.ts  # 🔐 Auth module registration
│   └── [new-module]/
│       └── [module].registry.ts # 🆕 New module
```

## 🚀 How to add a new Module

### Step 1: Create registry file for the module

```typescript
// src/modules/post/post.registry.ts
import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async (container: Container) => {
    // Import services from this module
    const { PostRepository } = await import('@/modules/post/post.repository');
    const { PostService } = await import('@/modules/post/post.service');
    const { PostController } = await import('@/modules/post/post.controller');

    // Register services with dependencies
    container.register('PostRepository', PostRepository);
    
    container.register('PostService', PostService, {
      dependencies: ['PostRepository', 'UnitOfWork'],
    });

    container.register('PostController', PostController, {
      dependencies: ['PostService'],
    });
  },
});
```

### Step 2: Add import in container-setup.ts

```typescript
// src/core/container-setup.ts
private async loadModules(): Promise<void> {
  await import('@/core/core.registry');
  await import('@/modules/user/user.registry');
  await import('@/modules/auth/auth.registry');
  await import('@/modules/post/post.registry'); // ✅ Only add this line
}
```

### Step 3: Add routes (if needed)

```typescript
// src/core/index.ts
export function initializeRoutes(): void {
  const authController = container.get<AuthController>('AuthController');
  const userController = container.get<UserController>('UserController');
  const postController = container.get<PostController>('PostController'); // ✅ Add this

  router.use('/auth', createAuthRoutes(authController));
  router.use('/users', createUserRoutes(userController));
  router.use('/posts', createPostRoutes(postController)); // ✅ And this
}
```

## 💡 Real Example

### Complete Product Module

```typescript
// src/modules/product/product.registry.ts
import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'ProductModule',
  register: async (container: Container) => {
    const { ProductRepository } = await import('@/modules/product/product.repository');
    const { ProductService } = await import('@/modules/product/product.service');
    const { ProductController } = await import('@/modules/product/product.controller');
    const { CategoryRepository } = await import('@/modules/product/category.repository');
    const { CategoryService } = await import('@/modules/product/category.service');

    // Repositories
    container.register('ProductRepository', ProductRepository);
    container.register('CategoryRepository', CategoryRepository);
    
    // Services  
    container.register('CategoryService', CategoryService, {
      dependencies: ['CategoryRepository', 'UnitOfWork'],
    });
    
    container.register('ProductService', ProductService, {
      dependencies: ['ProductRepository', 'CategoryService', 'UnitOfWork'],
    });

    // Controllers
    container.register('ProductController', ProductController, {
      dependencies: ['ProductService', 'CategoryService'],
    });
  },
});
```

## 🔍 Debugging & Monitoring

### View registered modules

```typescript
import { ModuleRegistry } from '@/core/module-registry';

// In controller or service
console.log('Registered modules:', ModuleRegistry.getRegisteredModules());
// Output: ['CoreModule', 'UserModule', 'AuthModule', 'PostModule']
```

### Debug container services

```typescript
import { Container } from '@/core/container';

const container = Container.getInstance();
console.log('All services:', container.getRegisteredServices());
```

## 🛡️ Best Practices

### ✅ Do:

1. **One registry per module**
   ```typescript
   // ✅ Good: product.registry.ts for ProductModule
   ModuleRegistry.registerModule({
     name: 'ProductModule',
     register: async (container) => { /* ... */ }
   });
   ```

2. **Clear module names**
   ```typescript
   // ✅ Good: Descriptive module names
   name: 'ProductModule'
   name: 'OrderManagementModule'
   name: 'PaymentModule'
   ```

3. **Accurate dependencies**
   ```typescript
   // ✅ Good: Declare correct dependencies
   container.register('ProductService', ProductService, {
     dependencies: ['ProductRepository', 'CategoryService', 'UnitOfWork'],
   });
   ```

### ❌ Don't:

1. **Register multiple modules in one file**
   ```typescript
   // ❌ Bad: Don't mix multiple modules
   ModuleRegistry.registerModule({ name: 'UserModule', ... });
   ModuleRegistry.registerModule({ name: 'ProductModule', ... }); // Separate to different file
   ```

2. **Hardcode dependencies**
   ```typescript
   // ❌ Bad: Don't hardcode
   const userService = new UserService(userRepository);
   
   // ✅ Good: Use container
   container.register('UserService', UserService, {
     dependencies: ['UserRepository'],
   });
   ```

## 🔄 Migration from old system

### Before (container-setup.ts monolithic):
```typescript
// ❌ Old way: All services in one place
async setupDependencies(): Promise<void> {
  const { UserRepository } = await import('@/user/user.repository');
  const { UserService } = await import('@/user/user.service');
  const { ProductRepository } = await import('@/product/product.repository');
  const { ProductService } = await import('@/product/product.service');
  // ... 50 more imports causing conflicts
}
```

### After (module registry):
```typescript
// ✅ New way: Each module self-registers
private async loadModules(): Promise<void> {
  await import('@/modules/user/user.registry');      // User team adds this
  await import('@/modules/product/product.registry'); // Product team adds this  
  await import('@/modules/order/order.registry');     // Order team adds this
  // No more conflicts! 🎉
}
```

## 🎯 Benefits for the team

1. **Parallel Development**: Each developer works on separate modules without conflicts
2. **Clear Ownership**: Each module manages its own dependencies
3. **Easy Testing**: Test each module independently
4. **Clean Architecture**: Clear separation of concerns
5. **Minimal Conflicts**: Only need to add 1 import line for new modules

## 📝 Template Usage

Copy from `src/core/template.registry.ts.example` to create a new module:

```bash
cp src/core/template.registry.ts.example src/modules/your-module/your-module.registry.ts
```

Then edit and add to `loadModules()` in `container-setup.ts`.

---

**Happy coding! 🚀** With this system, teams can develop in parallel without worrying about conflicts! 