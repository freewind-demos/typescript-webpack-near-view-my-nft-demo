import {INDEXER_SERVICE_URL} from "./config";

export async function fetchLikelyNftContractNames(accountId: string): Promise<string[]> {
    const url = `${INDEXER_SERVICE_URL}/account/${accountId}/likelyNFTs`
    const response = await fetch(url);
    const contractNames = await response.json();
    console.log({contractNames})
    return contractNames;
}