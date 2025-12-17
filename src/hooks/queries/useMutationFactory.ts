/**
 * Mutation Hook Factory
 *
 * DRY utility for creating React Query mutations with consistent patterns.
 * Eliminates repetitive mutation hook boilerplate across the codebase.
 */

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { handleError } from '@/lib/errors';

/**
 * Configuration for creating a mutation hook
 */
interface MutationConfig<TData, TVariables> {
  /** The mutation function to execute */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Context for error logging */
  context: string;
  /** User-facing error message */
  userMessage: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: (data: TData, variables: TVariables) => QueryKey[];
  /** Query keys to remove on success (for deletes) */
  removeKeys?: (data: TData, variables: TVariables) => QueryKey[];
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * Create a mutation hook with standardized error handling and cache invalidation
 */
export function createMutationHook<TData, TVariables>(
  config: MutationConfig<TData, TVariables>
) {
  return function useMutationHook() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: config.mutationFn,
      onSuccess: (data, variables) => {
        // Invalidate specified query keys
        if (config.invalidateKeys) {
          const keys = config.invalidateKeys(data, variables);
          keys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

        // Remove specified query keys (useful for deletes)
        if (config.removeKeys) {
          const keys = config.removeKeys(data, variables);
          keys.forEach((key) => {
            queryClient.removeQueries({ queryKey: key });
          });
        }

        // Call custom onSuccess callback
        if (config.onSuccess) {
          config.onSuccess(data, variables);
        }

        return data;
      },
      onError: (error) => {
        handleError(error, {
          context: config.context,
          userMessage: config.userMessage,
        });
      },
    });
  };
}

/**
 * Configuration for standard CRUD mutation hooks
 */
interface CrudMutationConfig<TData, TCreate, TUpdate> {
  /** Service object with CRUD methods */
  service: {
    create: (data: TCreate) => Promise<TData>;
    update: (id: string, data: TUpdate) => Promise<TData>;
    delete: (id: string) => Promise<void>;
  };
  /** Entity name for error messages */
  entityName: string;
  /** Query keys factory */
  queryKeys: {
    lists: () => QueryKey;
    detail: (id: string) => QueryKey;
  };
  /** Get the ID from created/updated data */
  getId: (data: TData) => string;
  /** Optional: Get additional keys to invalidate */
  getAdditionalKeys?: (data: TData) => QueryKey[];
}

/**
 * Create standard CRUD mutation hooks for an entity
 */
export function createCrudMutations<TData, TCreate, TUpdate>(
  config: CrudMutationConfig<TData, TCreate, TUpdate>
) {
  const { service, entityName, queryKeys, getId, getAdditionalKeys } = config;

  const useCreate = createMutationHook<TData, TCreate>({
    mutationFn: service.create,
    context: `useCreate${entityName}`,
    userMessage: `Failed to create ${entityName.toLowerCase()}`,
    invalidateKeys: (data) => {
      const keys: QueryKey[] = [queryKeys.lists()];
      if (getAdditionalKeys) {
        keys.push(...getAdditionalKeys(data));
      }
      return keys;
    },
  });

  const useUpdate = createMutationHook<TData, { id: string; updates: TUpdate }>({
    mutationFn: ({ id, updates }) => service.update(id, updates),
    context: `useUpdate${entityName}`,
    userMessage: `Failed to update ${entityName.toLowerCase()}`,
    invalidateKeys: (data) => {
      const keys: QueryKey[] = [queryKeys.lists(), queryKeys.detail(getId(data))];
      if (getAdditionalKeys) {
        keys.push(...getAdditionalKeys(data));
      }
      return keys;
    },
  });

  const useDelete = createMutationHook<void, string>({
    mutationFn: service.delete,
    context: `useDelete${entityName}`,
    userMessage: `Failed to delete ${entityName.toLowerCase()}`,
    invalidateKeys: () => [queryKeys.lists()],
    removeKeys: (_, id) => [queryKeys.detail(id)],
  });

  return { useCreate, useUpdate, useDelete };
}
