import {
  FetchSignerResult,
  PrepareWriteContractConfig,
  PrepareWriteContractResult,
  prepareWriteContract,
} from '@wagmi/core'
import { providers } from 'ethers'

import { QueryConfig, QueryFunctionArgs } from '../../types'
import { useSigner } from '../accounts'
import { useChainId, useQuery } from '../utils'

export type UsePrepareContractWriteArgs = Omit<
  PrepareWriteContractConfig,
  'signerOrProvider'
>
export type UsePrepareContractWriteConfig = QueryConfig<
  PrepareWriteContractResult,
  Error
>

export const queryKey = (
  {
    args,
    addressOrName,
    chainId,
    functionName,
    overrides,
  }: Omit<UsePrepareContractWriteArgs, 'contractInterface'>,
  {
    activeChainId,
    signerAddress,
  }: { activeChainId?: number; signerAddress?: string },
) =>
  [
    {
      entity: 'prepareContractTransaction',
      activeChainId,
      addressOrName,
      args,
      chainId,
      functionName,
      overrides,
      signerAddress,
    },
  ] as const

const queryFn =
  ({
    contractInterface,
    signer,
  }: {
    contractInterface: UsePrepareContractWriteArgs['contractInterface']
    signer?: FetchSignerResult
  }) =>
  ({
    queryKey: [{ args, addressOrName, chainId, functionName, overrides }],
  }: QueryFunctionArgs<typeof queryKey>) => {
    return prepareWriteContract({
      args,
      addressOrName,
      chainId,
      contractInterface,
      functionName,
      overrides,
      signer,
    })
  }

/**
 * @description Hook for preparing a contract write to be sent via [`useContractWrite`](/docs/hooks/useContractWrite).
 *
 * Eagerly fetches the parameters required for sending a contract write transaction such as the gas estimate.
 *
 * @example
 * import { useContractWrite, usePrepareContractWrite } from 'wagmi'
 *
 * const { config } = usePrepareContractWrite({
 *  addressOrName: '0xecb504d39723b0be0e3a9aa33d646642d1051ee1',
 *  contractInterface: wagmigotchiABI,
 *  functionName: 'feed',
 * })
 * const { data, isLoading, isSuccess, write } = useContractWrite(config)
 *
 */
export function usePrepareContractWrite({
  addressOrName,
  contractInterface,
  functionName,
  chainId,
  args,
  overrides,
  cacheTime,
  enabled = true,
  staleTime,
  suspense,
  onError,
  onSettled,
  onSuccess,
}: UsePrepareContractWriteArgs & UsePrepareContractWriteConfig) {
  const activeChainId = useChainId()
  const { data: signer } = useSigner<providers.JsonRpcSigner>({
    chainId: chainId ?? activeChainId,
  })

  const prepareContractWriteQuery = useQuery(
    queryKey(
      {
        addressOrName,
        functionName,
        chainId,
        args,
        overrides,
      },
      { activeChainId, signerAddress: signer?._address },
    ),
    queryFn({ contractInterface, signer }),
    {
      cacheTime,
      enabled: Boolean(enabled && signer),
      staleTime,
      suspense,
      onError,
      onSettled,
      onSuccess,
    },
  )
  return Object.assign(prepareContractWriteQuery, {
    config: {
      addressOrName,
      args,
      contractInterface,
      overrides,
      functionName,
      request: undefined,
      mode: 'prepared',
      ...prepareContractWriteQuery.data,
    } as PrepareWriteContractResult,
  })
}
