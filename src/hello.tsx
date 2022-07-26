import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';

import {AccountState, setupWalletSelector, WalletSelector} from '@near-wallet-selector/core';
import myNearWalletIcon from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png';
import {distinctUntilChanged, map} from 'rxjs';
import {setupModal, WalletSelectorModal} from '@near-wallet-selector/modal-ui';
import {setupMyNearWallet} from '@near-wallet-selector/my-near-wallet';
import {providers, connect as nearConnect} from 'near-api-js';
import {AccountView} from 'near-api-js/lib/providers/provider';

import '@near-wallet-selector/modal-ui/styles.css';

type Props = {};

export const NEAR_NETWORK = 'testnet';
export const NEAR_CONTRACT_ID = 'superfungible.testnet';

export const Hello: FC<Props> = ({}) => {

    const [selector, setSelector] = useState<WalletSelector>();
    const [modal, setModal] = useState<WalletSelectorModal>();
    const [accounts, setAccounts] = useState<AccountState[]>([]);
    const [accountData, setAccountData] = useState<AccountView>();
    const [accountId, setAccountId] = useState<string>('');

    const init = useCallback(async () => {
        const _selector = await setupWalletSelector({
            network: NEAR_NETWORK,
            debug: true,
            modules: [
                setupMyNearWallet({iconUrl: myNearWalletIcon}),
            ],
        });
        const _modal = setupModal(_selector, {
            contractId: NEAR_CONTRACT_ID,
            theme: 'dark',
        });
        const state = _selector.store.getState();

        setAccounts(state.accounts);

        setSelector(_selector);
        setModal(_modal);
    }, [])

    useEffect(() => {
        init().catch(error => {
            console.error(error)
            alert(error.message)
        })
    }, [init])

    useEffect(() => {
        if (!selector) {
            return;
        }

        const subscription = selector.store.observable
            .pipe(
                // @ts-ignore
                map((state) => state.accounts),
                distinctUntilChanged()
            )
            .subscribe((nextAccounts) => {
                console.log('Accounts Update', nextAccounts);
                setAccounts(nextAccounts);
            });

        return () => subscription.unsubscribe();
    }, [selector])

    const fetchAccountData = useCallback(async () => {
        if (!selector || !accountId) {
            return;
        }

        const {network} = selector.options;
        const provider = new providers.JsonRpcProvider({url: network.nodeUrl});

        const data = await provider.query<AccountView>({
            request_type: 'view_account',
            finality: 'final',
            account_id: accountId,
        });

        setAccountData(data);
    }, [selector])

    useEffect(() => {
        fetchAccountData().catch(error => {
            console.error(error);
            alert(error.message)
        })
    }, [fetchAccountData])

    const connectMyNearWallet = useCallback(() => {
        modal?.show()
    }, [modal])

    const logout = useCallback(() => {
        async function out() {
            if (selector) {
                const wallet = await selector.wallet();
                await wallet.signOut();
            }
            setAccountId('');
            setAccountData(undefined);
        }

        out().catch(error => {
            console.error(error)
            alert(error.message)
        });
    }, [selector]);

    useEffect(() => {
        setAccountId(accounts?.[0]?.accountId ?? '')
    }, [accounts])

    const nfts = useMemo(async () => {
        if (accountId) {
            const near = await nearConnect({
                nodeUrl: `https://rpc.${NEAR_NETWORK}.near.org`,
                headers: {},
                networkId: NEAR_NETWORK
            });
            const account = await near.account(accountId);
            // FIXME will throw error
            const nfts = await account.viewFunction(accountId, 'nft_tokens_for_owner', {
                account_id: accountId
            })
            console.log("### s", nfts);
            return nfts;
        }
        return undefined;
    }, [accountId])

    if (accounts.length === 0) {
        return <button type='button' onClick={connectMyNearWallet}>Connect MyNearWallet</button>;
    }

    return <>
        <select value={accountId} onChange={(event) => {
            console.log('event.target.selectedIndex', event.target.selectedIndex)
            setAccountId(accounts[event.target.selectedIndex]?.accountId)
        }}>
            {accounts.map(it =>
                <option key={it.accountId} value={it.accountId}>
                    {it.accountId} ({it.active ? 'active' : 'inactive'})
                </option>)}
        </select>
        <button onClick={logout}>Logout</button>
        <hr/>
        <pre>{JSON.stringify({accountId, accounts, accountData, nfts}, null, 4)}</pre>
    </>
    // return  accountData ?
    //     <div>
    //         <h2>Account: </h2>
    //         <pre>${JSON.stringify({accounts, accountData}, null, 4)}</pre>
    //         <button onClick={logout}>Logout</button>
    //     </div>
    //     :
}
