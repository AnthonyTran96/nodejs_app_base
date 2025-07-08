import { AuthGuard, RoleGuard } from '@/middleware/auth.middleware';
import { SanitizeUserInput } from '@/middleware/sanitization.middleware';
import { ValidateBody, ValidateParams, ValidateQuery } from '@/middleware/validation.middleware';
import { PostController } from '@/modules/post/post.controller';
import { CreatePostDto, PostFilterQueryDto, UpdatePostDto } from '@/modules/post/post.dto';
import { IdParamDto, PaginationDto } from '@/types/common.dto';
import { Role } from '@/types/role.enum';
import { Router } from 'express';

export function createPostRoutes(postController: PostController): Router {
  const router = Router();

  // Protected routes
  router.use(AuthGuard); // All routes below require authentication

  router.get(
    '/',
    ValidateQuery(PaginationDto),
    ValidateQuery(PostFilterQueryDto),
    postController.getPosts.bind(postController)
  );

  router.get('/:id', ValidateParams(IdParamDto), postController.getPostById.bind(postController));

  router.post(
    '/',
    SanitizeUserInput(),
    ValidateBody(CreatePostDto),
    postController.createPost.bind(postController)
  );

  router.put(
    '/:id',
    ValidateParams(IdParamDto),
    SanitizeUserInput(),
    ValidateBody(UpdatePostDto),
    postController.updatePost.bind(postController)
  );

  router.delete(
    '/:id',
    ValidateParams(IdParamDto),
    RoleGuard(Role.ADMIN),
    postController.deletePost.bind(postController)
  );

  return router;
}
