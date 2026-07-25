/**
 * TanStack Query Mock Harness for Component Testing
 *
 * Provides mock implementations of useQuery, useMutation, and useServerFn
 * that can be controlled by tests to simulate loading, error, and success states.
 *
 * Usage in test files:
 *
 *   import { createTanstackMocks } from "@/lib/testing/tanstack-query-mocks";
 *
 *   const mocks = createTanstackMocks();
 *
 *   test("renders loading state", async () => {
 *     mocks.setQueryState("my-query", { isLoading: true });
 *     const el = render(<MyComponent />);
 *     expect(el.getByTestId("skeleton")).toBeDefined();
 *   });
 *
 *   test("renders error state", async () => {
 *     mocks.setQueryState("my-query", {
 *       isError: true,
 *       error: new Error("Network failure"),
 *     });
 *     const el = render(<MyComponent />);
 *     expect(el.getByText("Network failure")).toBeDefined();
 *   });
 */

export interface MockQueryState {
  isLoading?: boolean;
  isError?: boolean;
  isPending?: boolean;
  error?: Error | null;
  data?: any;
  refetch?: () => Promise<any>;
  queryKey?: string[];
}

export interface MockMutationState {
  isPending?: boolean;
  isError?: boolean;
  error?: Error | null;
  data?: any;
  mutate?: (vars: any) => Promise<any>;
  mutateAsync?: (vars: any) => Promise<any>;
}

export class TanstackMockManager {
  private queryStates = new Map<string, MockQueryState>();
  private mutationStates = new Map<string, MockMutationState>();
  private serverFnMocks = new Map<string, (args: any) => Promise<any>>();

  constructor() {}

  /**
   * Set the state for a useQuery hook by queryKey.
   * keyPath: dot-separated path like "decisions" or "approvals.pending"
   */
  setQueryState(keyPath: string, state: MockQueryState) {
    this.queryStates.set(keyPath, {
      isLoading: false,
      isError: false,
      isPending: false,
      error: null,
      data: undefined,
      ...state,
    });
  }

  /**
   * Get the current state for a query.
   */
  getQueryState(keyPath: string): MockQueryState {
    return (
      this.queryStates.get(keyPath) || {
        isLoading: false,
        isError: false,
        isPending: false,
        error: null,
        data: undefined,
      }
    );
  }

  /**
   * Set the state for a useMutation hook by name.
   */
  setMutationState(name: string, state: MockMutationState) {
    this.mutationStates.set(name, {
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      ...state,
    });
  }

  /**
   * Get the current state for a mutation.
   */
  getMutationState(name: string): MockMutationState {
    return (
      this.mutationStates.get(name) || {
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
      }
    );
  }

  /**
   * Mock a server function (useServerFn) to return a specific value or reject.
   */
  mockServerFn(name: string, impl: (args: any) => Promise<any>) {
    this.serverFnMocks.set(name, impl);
  }

  /**
   * Get a mocked server function.
   */
  getServerFnMock(name: string): (args: any) => Promise<any> {
    return (
      this.serverFnMocks.get(name) ||
      (async (args: any) => ({
        /* default success response */
      }))
    );
  }

  /**
   * Reset all mocks to default (empty) state.
   */
  reset() {
    this.queryStates.clear();
    this.mutationStates.clear();
    this.serverFnMocks.clear();
  }
}

/**
 * Create a new TanstackMockManager instance for a test.
 */
export function createTanstackMocks(): TanstackMockManager {
  return new TanstackMockManager();
}

/**
 * Helper to create a mock useQuery hook that reads from the manager.
 * This is what you'd use in mock.module to replace @tanstack/react-query's useQuery.
 */
export function createMockUseQuery(manager: TanstackMockManager) {
  return function mockUseQuery({
    queryKey,
    queryFn,
  }: {
    queryKey: string[];
    queryFn?: () => Promise<any>;
  }) {
    const keyPath = queryKey.join(".");
    return manager.getQueryState(keyPath);
  };
}

/**
 * Helper to create a mock useMutation hook that reads from the manager.
 */
export function createMockUseMutation(manager: TanstackMockManager) {
  return function mockUseMutation({
    mutationFn,
  }: {
    mutationFn?: (vars: any) => Promise<any>;
  }) {
    // For a real implementation, we'd track multiple mutations.
    // For now, return a generic mutation state.
    const state = manager.getMutationState("default");
    return {
      ...state,
      mutate: state.mutate || (async (vars: any) => {}),
      mutateAsync: state.mutateAsync || (async (vars: any) => {}),
      variables: undefined,
      status: state.isError ? "error" : state.isPending ? "pending" : "success",
    };
  };
}

/**
 * Helper to create a mock useServerFn hook.
 */
export function createMockUseServerFn(manager: TanstackMockManager) {
  return function mockUseServerFn(serverFn: any) {
    const name = serverFn?.name || "unknown";
    const impl = manager.getServerFnMock(name);
    return impl;
  };
}
