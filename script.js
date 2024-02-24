const walletInputs = {
    addressInput: document.getElementById('addressInput'),
    balanceInput: document.getElementById('balanceInput'),
    historyInput: document.getElementById('historyInput')
};

async function mintToken() {
    try {
        const userWalletAddress = walletInputs.addressInput.value;

        if (!userWalletAddress) {
            document.getElementById('message').textContent = 'Please enter a valid wallet address.';
            return;
        }
        // 응답 요청
        const response = await fetch(`http://localhost:3000/mint?address=${userWalletAddress}`, {
            method: 'POST'
        });

        const data = await response.json();
        console.log(data);

        document.getElementById('message').textContent = data.message || 'Failed to mint token.';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Internal server error.';
    }
}

async function getBalance() {
    // 지갑 정보 입력
    const userWalletAddress = walletInputs.balanceInput.value;
    try {
        // 요청
        const response = await fetch(`http://localhost:3000/balanceOf?address=${userWalletAddress}`,);
        const data = await response.json();

        const balanceInEther = Number(data.balance) / 10 ** 18; // 18승으로 노출
        const formattedBalance = balanceInEther.toFixed(3); // 소수점 세 자리까지 표시

        document.getElementById('balance').textContent = `Balance: ${formattedBalance} ETH`;
    } catch (error) {
        console.error('밸런스 내역 가져오는 중에 오류', error);
    }
}

async function getTransactionHistory() {
    try {
        // 지갑 정보 입력
        const userWalletAddress = walletInputs.historyInput.value;
        // 요청
        const response = await fetch(`http://localhost:3000/history?address=${userWalletAddress}`);
        const data = await response.json();
        console.log(data);

        if (Array.isArray(data.history)) {
            const historyElement = document.getElementById('history');
            historyElement.innerHTML = '';
            // 100까지 출력이므로 1부터 100까지 숫자 붙이기
            for (let i = 0; i < data.history.length; i++) {
                const item = data.history[i];
                const transactionDiv = document.createElement('div');
                transactionDiv.innerHTML = `
                    <p>${i + 1}. Txn Hash: ${item.id}</p>
                    <p>Status: ${item.status}</p>
                    <p>Created At: ${new Date(item.createdAt).toLocaleString()}</p>
                    <hr>
                `;
                historyElement.appendChild(transactionDiv);
            }
        } else {
            console.error('거래 내역 데이터가 예상된 형식이 아닙니다:', data);
        }
    } catch (error) {
        console.error('거래 내역을 가져오는 중에 오류가 발생:', error);
    }
}