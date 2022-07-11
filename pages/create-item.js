import { useState } from "react";
import { ethers } from "ethers";
import {  create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from 'web3modal'; 

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import { nftaddress, nftmarketaddress } from "../config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import Image from "next/image";

export default function CreateItem (){
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({price:'', name:'', description:''});
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`recieved, ${prog}`)
                }
            )
            // file saved in the URL path below
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileUrl(url);
        } catch (e) {
            console.log(e);
        }
    }

    async function createItem () {
        const {name, description, price} = formInput;
        if(!name, !description, !fileUrl, !price) return 
        const data = JSON.stringify({name, description, image: fileUrl})
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            createSale(url)
        } catch (err) {
           console.log(err);
        }
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
    
        // sign the transaction
        const signer = provider.getSigner();
        console.log(nftaddress)
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url)
        let tx = await transaction.wait();
        console.log(tx);
        let event = tx.events[0];
        // let value = event.args[2] 
        // let tokenId = value.toNumber();
        contract.on('makeToken', res=> {
            console.log(res)
        })

        // const price = ethers.utils.parseUnits(formInput.price, 'ether');
        // contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        // let  listingPrice = await contract.getListPrice();
        // transaction = await contract.createMarketItem()(nftaddress, tokenId, price, {value: listingPrice});
        // await transaction.wait();

        router.push('/');
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input 
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, name:e.target.value})}
                />
                <textarea 
                    placeholder="Asset Description"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, description:e.target.value})}
                />
                <input 
                    type="number"
                    placeholder="Asset Price in Eth"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, price:e.target.value})}
                />
                <input 
                    type="file"
                    name = "Asset"
                    className="my-4"
                    onChange= {onChange}
                />
                {
                    fileUrl && (
                        <Image className="rounded mt-4" 
                            src={fileUrl}
                            alt="Nft Image"
                            width={350}
                            height={230}
                        />
                    )
                }
                <button onClick={createItem} className="bg-pink-500 mt-4 font-bold text-white rounded p-4 shadow-lg" 
                > Create NFT </button>
            </div>
        </div>
    )
}