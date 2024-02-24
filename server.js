const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { abi, contractAddress } = require('./contractInfo');
const { JsonRpcProvider } = require('ethers');
const fetch = require('cross-fetch');
require('dotenv').config();
const fs = require('fs');
const app = express();
const port = 3000;
app.use(cors());

// .env 연동
const provider = new JsonRpcProvider(process.env.url);
const wallet = new ethers.Wallet(process.env.privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

let requestQueue = [];
requestQueue = loadRequestQueue();
let isProcessing = false;
const requestQueueFile = 'requestQueue.json'; // 요청을 저장할 파일

// 요청을 파일에 저장
function saveRequestQueue(queue) {
    fs.writeFileSync(requestQueueFile, JSON.stringify(queue));
}

// 서버 종료 시 요청 큐 저장
process.on('exit', () => {
    saveRequestQueue(requestQueue);
    console.log('Server is shutting down. Request queue saved.');
});

// 파일에서 요청을 로드
function loadRequestQueue() {
    try {
        const data = fs.readFileSync(requestQueueFile);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// 요청 처리 함수
// queue를 사용해 트랜잭션 요청을 빠르게 n번 클릭하여도 순차적으로 받음
// nonce random을 사용해 n번을 빠르게 요청하여도 요청값이 겹칠 확률이 드물어 트랜잭션 오류를 방지함
async function processRequests() {
    if (isProcessing || requestQueue.length === 0) {
        return;
    }
    isProcessing = true;
    const { req, res } = requestQueue.shift();
    const userAddress = req.query.address;
    res.status(200).json({ message: '요청이 수신되었습니다.' }); // 요청 응답
    try {
        // 무작위 nonce 생성, nonce 발행은 한계가 있기 때문에 수정
        const randomNonce = Math.floor(Math.random() * 1000000000000000);
        // mint 함수 호출 및 생성된 nonce 전달
        await contract.mint(userAddress, { nonce: randomNonce });
        console.log('트랜잭션 성공:', userAddress);
    } catch (error) {
        console.error('트랜잭션 실패:', error);
    } finally {
        isProcessing = false;
        processRequests(); // 다음 요청 처리
    }
}

// 요청이 들어올 때 요청을 파일에 저장하고 처리 함수 호출
app.post('/mint', (req, res) => {
    try {
        requestQueue.push({ req, res });
        // mint 함수 실행
        processRequests();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: '서버 에러' });
    }
});

// 잔액 조회
app.get('/balanceOf', async (req, res) => {
    try {
        const address = req.query.address;
        const balance = await contract.balanceOf(address);
        const balanceString = balance.toString();
        res.status(200).json({ balance: balanceString });
    } catch (error) {
        console.error('잔액을 가져오는 중 에러 발생:', error);
        res.status(500).json({ error: '잔액을 가져오는 중 에러 발생' });
    }
});

// 거래 히스토리 조회
app.get('/history', async (req, res) => {
    try {
        const address = req.query.address;
        const apiKey = process.env.ETHERSCAN_API_KEY;
        const url = `https://api-holesky.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}&page=1&offset=100`;
        const response = await fetch(url);
        const data = await response.json();

        // 요청에 대한 응답으로부터 히스토리를 생성합니다.
        let history = [];
        if (Array.isArray(data.result)) {
            history = data.result.map(tx => ({
                id: tx.hash,
                createdAt: new Date(tx.timeStamp * 1000),
                status: tx.txreceipt_status === '' ? 'PENDING' : 'SUCCESS'
            })).slice(0, 100);
        }
        // 히스토리를 createdAt 내림차순으로 정렬합니다.
        history.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({ history });
    } catch (error) {
        console.error('히스토리를 가져오는 중 에러 발생:', error);
        res.status(500).json({ error: '히스토리를 가져오는 중 에러 발생' });
    }
});

// 서버 시작 및 요청 처리
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    processRequests(); // 요청 처리 함수 호출
});