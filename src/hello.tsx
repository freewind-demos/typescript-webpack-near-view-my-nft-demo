import React, {FC, useCallback, useEffect, useState} from 'react';

import {setupWalletSelector, WalletSelector} from '@near-wallet-selector/core';
import myNearWalletIcon from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png';
import {distinctUntilChanged, map} from 'rxjs';
import {setupModal, WalletSelectorModal} from '@near-wallet-selector/modal-ui';
import {setupMyNearWallet} from '@near-wallet-selector/my-near-wallet';
import {providers} from 'near-api-js';
import {AccountView} from 'near-api-js/lib/providers/provider';

import '@near-wallet-selector/modal-ui/styles.css';

type Props = {};

export const NEAR_NETWORK = 'testnet';
export const NEAR_CONTRACT_ID = 'superfungible.testnet';

export const Hello: FC<Props> = ({}) => {
    const [selector, setSelector] = useState<WalletSelector>();
    const [modal, setModal] = useState<WalletSelectorModal>();
    const [accountId, setAccountId] = useState<string>();
    const [accountData, setAccountData] = useState<AccountView>();

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

        setAccountId(state.accounts.find(it => it.accountId)?.accountId);

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

                setAccountId(nextAccounts.find(it => it.active)?.accountId);
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
            setAccountId(undefined);
            setAccountData(undefined);
        }

        out().catch(error => {
            console.error(error)
            alert(error.message)
        });
    }, [selector]);

    return accountId && accountData ?
        <div>
            <h2>Account: </h2>
            <pre>${JSON.stringify({accountId, accountData}, null, 4)}</pre>
            <button onClick={logout}>Logout</button>
        </div>
        : <button type='button' onClick={connectMyNearWallet}>Connect MyNearWallet</button>
}
