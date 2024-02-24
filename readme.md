# 설명
- 1. 'API 요청을 함으로써 원하는 지갑에 토큰을 발행할 수 있는 API 대행 서비스'를 이해하는 바로 메인 지갑의 비밀키(.env)가 코드 안에 존재하며, 이 메인 지갑이 가스비를 대신 내고 있습니다.
- 2. 메타마스크 연동이 아닌, 지갑 주소만 입력하면 가스비를 받지 않는 발행이 가능합니다.
- 3. 테스트 방법은 2가지이며 curl과 web입니다. 자세한 방법은 아래에 적었습니다.
- 4. Mint Token 버튼을 누르고 빠르게 n번 눌러도 트랜잭션이 유실되지 않습니다.
- 5. Balance는 편하게 소수점 3자리수 까지 노출했습니다.
- 6. Transaction History는 총 100개까지 노출되며, 이더스캔 API에서 가져왔습니다.
- 7. .env 파일을 생성하여 아래의 3가지 정보를 넣어주세요.
    > - privateKey = `웹3 지갑 프라이빗 키`
    > - url = `https://1rpc.io/holesky`
    > - ETHERSCAN_API_KEY  = `이더스캔 API KEY`
- 8. 네트워크
    - Holesky ETH
- 9. 토큰 스마트 컨트랙트 & 이더스캔 주소
    - `0xd16d41635C7ECe3c13B2c7Eae094a92aDF41bB2a` `https://holesky.etherscan.io/address/0xd16d41635C7ECe3c13B2c7Eae094a92aDF41bB2a`
- 10. Holesky ETH 테스트 Faucet
    - `https://holesky-faucet.pk910.de/`
---
# 패키지 설치
- `npm install body-parser@1.20.2 cors@2.8.5 cross-fetch@4.0.0 dotenv@16.4.5 ethers@6.11.1 express@4.18.2 node-fetch@3.3.2`
---
# 진행
- mint, balanceOf, transhistory 기능 구현
---
# 실행 테스트1 - curl
## 파워셀
- `npm start` || `node server.js`
## bash
- `0x74B76eEde2291f17f1597018aB45C3272c3E106A` 부분에 테스트 지갑 주소를 수정해주세요.
### mint 명령어
> `curl -X POST "http://localhost:3000/mint?address=0x74B76eEde2291f17f1597018aB45C3272c3E106A"`
### balanceOf 명령어
> `curl "http://localhost:3000/balanceOf?address=0x74B76eEde2291f17f1597018aB45C3272c3E106A"`
### history 명령어
> `curl "http://localhost:3000/history?address=0x74B76eEde2291f17f1597018aB45C3272c3E106A"`
---
# 실행 테스트2 - 웹
> 1. extensions -> Live Server install
> 2. index.html 파일 우측 클릭 -> Open with live server 클릭
> 3. 파워셀 -> `npm start` || `node server.js` 명령어 입력
> 4. 웹에서 테스트 기능에 대해 지갑 주소 입력 후 버튼 클릭
> 5. F12 작업 관리자 네트워크에서 응답 확인
---
# 파일 설명
> - `.env` = 지갑키와 API 등의 정보 기입
  > - privateKey = `웹3 지갑 프라이빗 키`
  > - url = `https://1rpc.io/holesky`
  > - ETHERSCAN_API_KEY  = `이더스캔 API KEY`
> - `contractinfo.js` = 스마트 컨트랙트 연동을 위한 ABI와 contract 주소
> - `package.json` = 패키지 버전
> - `script.js` = 서버와 연동하기 위한 script
> - `server.js` = express.js, ethers.js로 만들어진 이더리움 연동
> - `index.html` = 웹 테스트를 위한 간단한 html
> - `requestQueue.json` = 서버 강제 종료시 요청된 데이터 저장
---
# 구현 상세 스펙
- `POST /mint`
    - 대략 1초 동안 N번을 호출하면 N개의 tx가 모두 처리되어야 합니다.
        - N개의 요청을 queue에 넣고, 1개씩 tx를 발생시키고 완료 후 다음 요청을 처리하는 방법입니다.
    - 프로그램이 실행 중간에 꺼지고 다시 실행되더라도, 이미 들어왔었던 사용자의 요청이 유실되지 않아야 합니다.
- `GET /balanceOf`
    - 실제 ERC20의 현재 잔고를 반환합니다.
- `GET /history`
    - 해당 주소에 대해 처리하고 있는 요청의 목록을 createdAt 내림차순으로 제공합니다.
    - `SUCCESS`는 tx를 블록체인에 전파에 성공한 상태입니다.
    - history 목록은 최대 100개까지만 제공합니다.
