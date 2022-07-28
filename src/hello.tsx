import React, {FC, useState} from 'react';
import {connect, WalletConnection} from 'near-api-js';

import '@near-wallet-selector/modal-ui/styles.css';
import {fetchLikelyNftContractNames} from "./apis/fetchLikelyNftContractNames";

type NftMetaData = {
    base_uri: string; // "https://ipfs.fleek.co/ipfs"
    icon: string; // "data:image/svg+xml,%3Csvg width='1080' height='1080' viewBox='0 0 1080 1080' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1080' height='1080' rx='10' fill='%230000BA'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M335.238 896.881L240 184L642.381 255.288C659.486 259.781 675.323 263.392 689.906 266.718C744.744 279.224 781.843 287.684 801.905 323.725C827.302 369.032 840 424.795 840 491.014C840 557.55 827.302 613.471 801.905 658.779C776.508 704.087 723.333 726.74 642.381 726.74H468.095L501.429 896.881H335.238ZM387.619 331.329L604.777 369.407C614.008 371.807 622.555 373.736 630.426 375.513C660.02 382.193 680.042 386.712 690.869 405.963C704.575 430.164 711.428 459.95 711.428 495.321C711.428 530.861 704.575 560.731 690.869 584.932C677.163 609.133 648.466 621.234 604.777 621.234H505.578L445.798 616.481L387.619 331.329Z' fill='white'/%3E%3C/svg%3E"
    name: string; // "Paras Collectibles"
    reference: null; // TODO
    reference_hash: string | null; // null
    spec: string; // "nft-1.0.0"
    symbol: string; // "PARAS"
}

type NftToken = {
    approved_account_ids: {}
    metadata?: {
        copies: number; // 999
        description: string | null; // null
        expires_at: null // TODO
        extra: null // TODO
        issued_at: string; // "1658836483010978094"
        media: string; // "bafkreigbfbwbrwakiiquwsg2ntikyjbegdkr7ean6ez7ybxaozassr27bm"
        media_hash: string | null; // null
        reference: string; // "bafkreicrvczu2xh6gt3p3aykxoakwbnaekacw4e7jyghneg24hvadsosvi"
        reference_hash: string | null; // null
        starts_at: null // TODO
        title: string; // "Purple Wall #703"
        updated_at: null // TODO
    },
    owner_id: string; // "freewind.testnet"
    token_id: string; // "40:703"
}

export const Hello: FC = () => {
    const [accountId, setAccountId] = useState<string>('freewind.testnet')
    const [nfts, setNfts] = useState<{ contractName: string, nftMetaData: NftMetaData, nftTokens: NftToken[] }[]>();


    async function fetchNfts() {
        const near = await connect({
            networkId: "testnet",
            nodeUrl: "https://rpc.testnet.near.org",
            headers: {}
            // walletUrl: "https://wallet.testnet.near.org",
            // helperUrl: "https://helper.testnet.near.org",
            // keyStore, // optional if not signing transactions
        });

        const wallet = new WalletConnection(near, null);
        const account = wallet.account();

        const contractNames = await fetchLikelyNftContractNames(accountId)
        const nfts = await Promise.all(contractNames.map(async contractName => {
                const nftMetaData: NftMetaData = await account.viewFunction(contractName, 'nft_metadata')
                const allTokens: NftToken[] = await account.viewFunction(contractName, 'nft_tokens_for_owner', {
                    account_id: accountId,
                });
                const tokens = allTokens.filter(it => Boolean(it.metadata))
                return {
                    contractName,
                    nftMetaData,
                    nftTokens: tokens
                }
            })
        )
        setNfts(nfts);
    }

    return <div>
        <div>
            <input type={'text'} value={accountId} onChange={(event) => setAccountId(event.target.value)}/>
            <button onClick={fetchNfts}>Fetch NTFs</button>
        </div>
        {nfts?.map(nft => <div key={nft.contractName}>
            <h2>{nft.nftMetaData.name} ({nft.contractName})</h2>
            {nft.nftTokens.map(it => <div key={it.token_id}>
                <div style={{display: 'inline-block'}}>
                    <div>tokenId: {it.token_id}</div>
                    <div><img src={`${nft.nftMetaData.base_uri}/${it.metadata?.media}`}/></div>
                </div>
            </div>)}
        </div>)}
        <hr/>
        <div>
            <pre>{JSON.stringify(nfts, null, 4)}</pre>
        </div>
    </div>;
}
