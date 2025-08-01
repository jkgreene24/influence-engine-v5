/*************************************************************************************************

Welcome to Baml! To use this generated code, please run one of the following:

$ npm install @boundaryml/baml
$ yarn add @boundaryml/baml
$ pnpm add @boundaryml/baml

*************************************************************************************************/

// This file was generated by BAML: do not edit it. Instead, edit the BAML
// files and re-generate this code.
//
/* eslint-disable */
// tslint:disable
// @ts-nocheck
// biome-ignore format: autogenerated code
'use client'

import type { BamlErrors } from '@boundaryml/baml/errors'
import { toBamlError } from '@boundaryml/baml/errors'
import { useCallback, useMemo, useReducer, useTransition } from 'react'
import * as Actions from './server'
import * as StreamingActions from './server_streaming'
import type { StreamingServerTypes } from './server_streaming_types'

/**
 * Type representing a BAML stream response.
 *
 * @template PartialType The type of the partial response.
 * @template FinalType The type of the final response.
 */
type BamlStreamResponse<PartialType, FinalType> = {
  partial?: PartialType
  final?: FinalType
  error?: BamlErrors
}

/**
 * A server action that returns either a ReadableStream of Uint8Array or a final output.
 */
export type ServerAction<Input = any, Output = any> = (
  ...args: Input extends any[] ? Input : [Input]
) => Promise<Output> | ReadableStream<Uint8Array>

/**
 * Type representing all function names except 'stream' and 'stream_types'
 */
export type FunctionNames = keyof typeof Actions

/**
 * Helper type to derive the partial return type for an action.
 */
type StreamDataType<FunctionName extends FunctionNames> = StreamingServerTypes[FunctionName]

/**
 * Helper type to derive the final return type for an action.
 */
type FinalDataType<FunctionName extends FunctionNames> = (typeof Actions)[FunctionName] extends (...args: any) => any
  ? Awaited<ReturnType<(typeof Actions)[FunctionName]>>
  : never

/**
 * Configuration options for BAML React hooks.
 */
export type HookInput<FunctionName extends FunctionNames = FunctionNames, Options extends { stream?: boolean } = { stream?: true }> = {
  stream?: Options['stream']
  onStreamData?: Options['stream'] extends false ? never : (response?: StreamDataType<FunctionName>) => void
  onFinalData?: (response?: FinalDataType<FunctionName>) => void
  onData?: (response?: Options['stream'] extends false ? FinalDataType<FunctionName> : FinalDataType<FunctionName> | StreamDataType<FunctionName>) => void
  onError?: (error: BamlErrors) => void
}

export type NonStreamingHookStatus = 'idle' | 'pending' | 'success' | 'error'
export type StreamingHookStatus = NonStreamingHookStatus | 'streaming'

export type HookStatus<Options extends { stream?: boolean } = { stream?: true }> = Options['stream'] extends false
  ? NonStreamingHookStatus
  : StreamingHookStatus

/**
 * Return type for BAML React hooks.
 */
export type HookOutput<FunctionName extends FunctionNames = FunctionNames, Options extends { stream?: boolean } = { stream?: true }> = {
  data?: Options['stream'] extends false ? FinalDataType<FunctionName> : FinalDataType<FunctionName> | StreamDataType<FunctionName>
  finalData?: FinalDataType<FunctionName>
  streamData?: Options['stream'] extends false ? never : StreamDataType<FunctionName>
  isLoading: boolean
  isPending: boolean
  isStreaming: Options['stream'] extends false ? never : boolean
  isSuccess: boolean
  isError: boolean
  error?: BamlErrors
  status: HookStatus<Options>
  mutate: (
    ...args: Parameters<(typeof Actions)[FunctionName]>
  ) => Options['stream'] extends false ? Promise<FinalDataType<FunctionName>> : Promise<ReadableStream<Uint8Array>>
  reset: () => void
}

export type HookData<FunctionName extends FunctionNames, Options extends { stream?: boolean } = { stream?: true }> = NonNullable<HookOutput<FunctionName, Options>['data']>;

/**
 * Type guard to check if the hook props are configured for streaming mode.
 *
 * @template FunctionName - The name of the BAML function.
 * @param props - The hook props.
 * @returns {boolean} True if the props indicate streaming mode.
 */
function isStreamingProps<FunctionName extends FunctionNames>(
  props: HookInput<FunctionName, { stream?: boolean }>,
): props is HookInput<FunctionName, { stream?: true }> {
  return props.stream !== false
}

interface HookState<TPartial, TFinal> {
  isSuccess: boolean
  isStreaming: boolean
  error?: BamlErrors
  finalData?: TFinal
  streamData?: TPartial
}

type HookStateAction<TPartial, TFinal> =
  | { type: 'START_REQUEST' }
  | { type: 'SET_ERROR'; payload: BamlErrors }
  | { type: 'SET_PARTIAL'; payload: TPartial }
  | { type: 'SET_FINAL'; payload: TFinal }
  | { type: 'RESET' }

/**
 * Reducer function to manage the hook state transitions.
 *
 * @template TPartial - The type of the partial (streaming) data.
 * @template TFinal - The type of the final (non‑streaming) data.
 * @param state - The current hook state.
 * @param action - The action to apply.
 * @returns The updated state.
 */
function hookReducer<TPartial, TFinal>(
  state: HookState<TPartial, TFinal>,
  action: HookStateAction<TPartial, TFinal>,
): HookState<TPartial, TFinal> {
  switch (action.type) {
    case 'START_REQUEST':
      return {
        ...state,
        isSuccess: false,
        error: undefined,
        isStreaming: false,
        finalData: undefined,
        streamData: undefined,
      }
    case 'SET_ERROR':
      return {
        ...state,
        isSuccess: false,
        isStreaming: false,
        error: action.payload,
      }
    case 'SET_PARTIAL':
      return {
        ...state,
        isStreaming: true,
        streamData: action.payload,
      }
    case 'SET_FINAL':
      return {
        ...state,
        isSuccess: true,
        isStreaming: false,
        finalData: action.payload,
      }
    case 'RESET':
      return {
        isSuccess: false,
        isStreaming: false,
        error: undefined,
        finalData: undefined,
        streamData: undefined,
      }
    default:
      return state
  }
}

/**
 * Base hook for executing BAML server actions, supporting both streaming and non‑streaming modes.
 *
 * This hook provides a unified interface for handling loading states, partial updates, errors,
 * and final responses. It is designed to be used directly with any BAML server action.
 *
 * Features:
 * - **Streaming Support:** Real‑time partial updates via `streamData`, progress indicators, and incremental UI updates.
 * - **State Management:** Manages loading state (`isLoading`), success/error flags, and final/partial results.
 * - **Error Handling:** Supports type‑safe error handling for BamlValidationError, BamlClientFinishReasonError, and standard errors.
 *
 * @param Action - The server action to invoke.
 * @param props - Configuration props for the hook.
 * @returns An object with the current state and a `mutate` function to trigger the action.
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, mutate } = useBamlAction(StreamingActions.TestAws, { stream: true });
 * ```
 */
function useBamlAction<FunctionName extends FunctionNames>(
  action: ServerAction,
  props: HookInput<FunctionName, { stream: false }>,
): HookOutput<FunctionName, { stream: false }>
function useBamlAction<FunctionName extends FunctionNames>(
  action: ServerAction,
  props?: HookInput<FunctionName, { stream?: true }>,
): HookOutput<FunctionName, { stream: true }>
function useBamlAction<FunctionName extends FunctionNames>(
  action: ServerAction,
  props: HookInput<FunctionName, { stream?: boolean }> = {},
): HookOutput<FunctionName, { stream: true }> | HookOutput<FunctionName, { stream: false }> {
  const { onFinalData, onError } = props
  const [isLoading, startTransition] = useTransition()

  const [state, dispatch] = useReducer(hookReducer<StreamDataType<FunctionName>, FinalDataType<FunctionName>>, {
    isSuccess: false,
    error: undefined,
    finalData: undefined,
    isStreaming: false,
    streamData: undefined,
  })

  const mutate = useCallback(
    async (...input: Parameters<ServerAction>) => {
      dispatch({ type: 'START_REQUEST' })
      try {
        let response: Awaited<ReturnType<ServerAction>>
        startTransition(async () => {
          // Transform any BamlImage or BamlAudio inputs to their JSON representation
          const transformedInput = input.map(arg => {
            // Check if the argument is an instance of BamlImage or BamlAudio
            // We check the constructor name since the actual classes might be proxied in browser environments
            if (arg && typeof arg === 'object' &&
                (arg.constructor.name === 'BamlImage' || arg.constructor.name === 'BamlAudio')) {
              return arg.toJSON();
            }
            return arg;
          });

          response = await action(...transformedInput)

          if (isStreamingProps(props) && response instanceof ReadableStream) {
            const reader = response.getReader()
            const decoder = new TextDecoder()
            try {
              while (true) {
                const { value, done } = await reader.read()
                if (done) break
                if (value) {
                  const chunk = decoder.decode(value, { stream: true }).trim()
                  try {
                    const parsed: BamlStreamResponse<
                      StreamDataType<FunctionName>,
                      FinalDataType<FunctionName>
                    > = JSON.parse(chunk)
                    if (parsed.error) {
                       if (parsed.error instanceof Error) {
                        throw parsed.error
                      }

                      const parsedError = JSON.parse(parsed.error)
                      const finalError = toBamlError(parsedError)
                      throw finalError
                    }
                    if (parsed.partial !== undefined) {
                      dispatch({ type: 'SET_PARTIAL', payload: parsed.partial })
                      if (isStreamingProps(props)) {
                        props.onStreamData?.(parsed.partial)
                      }
                      props.onData?.(parsed.partial)
                    }
                    if (parsed.final !== undefined) {
                      dispatch({ type: 'SET_FINAL', payload: parsed.final })
                      onFinalData?.(parsed.final)
                      props.onData?.(parsed.final)
                      return
                    }
                  } catch (err: unknown) {
                    dispatch({
                      type: 'SET_ERROR',
                      payload: err as BamlErrors,
                    })
                    onError?.(err as BamlErrors)
                    break
                  }
                }
              }
            } finally {
              reader.releaseLock()
            }
            return
          }
          // Non‑streaming case
          dispatch({ type: 'SET_FINAL', payload: response })
          onFinalData?.(response)
        })
        return response
      } catch (error_: unknown) {
        dispatch({ type: 'SET_ERROR', payload: error_ as BamlErrors })
        onError?.(error_ as BamlErrors)
        throw error_
      }
    },
    [action, onFinalData, onError, props],
  )

  const status = useMemo<HookStatus<{ stream: typeof props.stream }>>(() => {
    if (state.error) return 'error'
    if (state.isSuccess) return 'success'
    if (state.isStreaming) return 'streaming'
    if (isLoading) return 'pending'
    return 'idle'
  }, [isLoading, state.error, state.isSuccess, state.isStreaming])

  let data:
		| FinalDataType<FunctionName>
		| StreamDataType<FunctionName>
		| undefined = state.finalData;
  if (state.isStreaming) data = state.streamData

  const result = {
    data,
    finalData: state.finalData,
    error: state.error,
    isError: status === 'error',
    isSuccess: status === 'success',
    isStreaming: status === 'streaming',
    isPending: status === 'pending',
    isLoading: status === 'pending' || status === 'streaming',
    mutate,
    status,
    reset: () => dispatch({ type: 'RESET' }),
  } satisfies HookOutput<FunctionName, { stream: typeof props.stream }>

  return {
    ...result,
    streamData: isStreamingProps(props) ? state.streamData : undefined,
  } satisfies HookOutput<FunctionName, { stream: typeof props.stream }>
}
/**
 * A specialized hook for the Betty BAML function that supports both streaming and non‑streaming responses.
 *
 * **Input Types:**
 *
 * - instruction: string
 *
 * - messages: Message[]
 *
 * - relevant_feedbacks: string
 *
 * - user_metadata: UserMetadata
 *
 * - user_memory: string
 *
 *
 * **Return Type:**
 * - **Non‑streaming:** ResponseChat
 * - **Streaming Partial:** partial_types.ResponseChat
 * - **Streaming Final:** ResponseChat
 *
 * **Usage Patterns:**
 * 1. **Non‑streaming (Default)**
 *    - Best for quick responses and simple UI updates.
 * 2. **Streaming**
 *    - Ideal for long‑running operations or real‑time feedback.
 *
 * **Edge Cases:**
 * - Ensure robust error handling via `onError`.
 * - Handle cases where partial data may be incomplete or missing.
 *
 * @example
 * ```tsx
 * // Basic non‑streaming usage:
 * const { data, error, isLoading, mutate } = useBetty({ stream: false});
 *
 * // Streaming usage:
 * const { data, streamData, isLoading, error, mutate } = useBetty({
 *   stream: true | undefined,
 *   onStreamData: (partial) => console.log('Partial update:', partial),
 *   onFinalData: (final) => console.log('Final result:', final),
 *   onError: (err) => console.error('Error:', err),
 * });
 * ```
 */
export function useBetty(props: HookInput<'Betty', { stream: false }>): HookOutput<'Betty', { stream: false }>
export function useBetty(props?: HookInput<'Betty', { stream?: true }>): HookOutput<'Betty', { stream: true }>
export function useBetty(
  props: HookInput<'Betty', { stream?: boolean }> = {},
): HookOutput<'Betty', { stream: true }> | HookOutput<'Betty', { stream: false }> {
  let action: ServerAction = Actions.Betty;
  if (isStreamingProps(props)) {
    action = StreamingActions.Betty;
  }
  return useBamlAction(action, props as HookInput)
}
/**
 * A specialized hook for the InitialMessageChat BAML function that supports both streaming and non‑streaming responses.
 *
 * **Input Types:**
 *
 * - instruction: string
 *
 * - relevant_feedbacks: string
 *
 * - user_influence_style: string
 *
 * - user_memory: string
 *
 *
 * **Return Type:**
 * - **Non‑streaming:** string
 * - **Streaming Partial:** string
 * - **Streaming Final:** string
 *
 * **Usage Patterns:**
 * 1. **Non‑streaming (Default)**
 *    - Best for quick responses and simple UI updates.
 * 2. **Streaming**
 *    - Ideal for long‑running operations or real‑time feedback.
 *
 * **Edge Cases:**
 * - Ensure robust error handling via `onError`.
 * - Handle cases where partial data may be incomplete or missing.
 *
 * @example
 * ```tsx
 * // Basic non‑streaming usage:
 * const { data, error, isLoading, mutate } = useInitialMessageChat({ stream: false});
 *
 * // Streaming usage:
 * const { data, streamData, isLoading, error, mutate } = useInitialMessageChat({
 *   stream: true | undefined,
 *   onStreamData: (partial) => console.log('Partial update:', partial),
 *   onFinalData: (final) => console.log('Final result:', final),
 *   onError: (err) => console.error('Error:', err),
 * });
 * ```
 */
export function useInitialMessageChat(props: HookInput<'InitialMessageChat', { stream: false }>): HookOutput<'InitialMessageChat', { stream: false }>
export function useInitialMessageChat(props?: HookInput<'InitialMessageChat', { stream?: true }>): HookOutput<'InitialMessageChat', { stream: true }>
export function useInitialMessageChat(
  props: HookInput<'InitialMessageChat', { stream?: boolean }> = {},
): HookOutput<'InitialMessageChat', { stream: true }> | HookOutput<'InitialMessageChat', { stream: false }> {
  let action: ServerAction = Actions.InitialMessageChat;
  if (isStreamingProps(props)) {
    action = StreamingActions.InitialMessageChat;
  }
  return useBamlAction(action, props as HookInput)
}