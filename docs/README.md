# 📦 Module Registry System

A module registration system to **reduce conflicts** when multiple developers add services simultaneously.

## 🎯 The Problem

```typescript
// ❌ Problematic: All developers edit the same file
export class ContainerSetup {
  async setupDependencies(): Promise<void> {
    const { ProductService } = await import('@/modules/product/product.service'); // Dev A
    const { OrderService } = await import('@/modules/order/order.service');       // Dev B  
    const { PaymentService } = await import('@/modules/payment/payment.service'); // Dev C
    // ⚠️ MERGE CONFLICTS! 
  }
}
```

## ✅ Solution: Module Registry

### 1. Each module self-registers

```typescript
// src/modules/post/post.registry.ts
import { Container } from '@/core/container';
import { ModuleRegistry } from '@/core/module-registry';

ModuleRegistry.registerModule({
  name: 'PostModule',
  register: async (container: Container) => {
    const { PostRepository } = await import('./post.repository');
    const { PostService } = await import('./post.service');
    const { PostController } = await import('./post.controller');

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

### 2. Add to container setup

```typescript
// src/core/container-setup.ts
private async loadModules(): Promise<void> {
  await import('@/core/core.registry');
  await import('@/modules/user/user.registry');
  await import('@/modules/auth/auth.registry');
  await import('@/modules/post/post.registry'); // ✅ Dev only adds this line!
}
```

## 🚀 How to add a new module

1. **Copy template**:
   ```bash
   cp src/core/template.registry.ts.example src/modules/your-module/your-module.registry.ts
   ```

2. **Edit template** with your module name and services

3. **Add 1 line** in `container-setup.ts`:
   ```typescript
   await import('@/modules/your-module/your-module.registry');
   ```

4. **Done!** ✨

## 🎯 Results

**Before**: Each dev adds service → conflict  
**After**: Each dev adds 1 line → minimal conflict  

**Team velocity** ⬆️ **Conflicts** ⬇️

---

📚 **Details**: See `docs/MODULE_REGISTRY_GUIDE.md` 