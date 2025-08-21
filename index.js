// 필요한 모듈 가져오기
const express = require('express'); // Express 웹 프레임워크
const cors = require('cors'); // CORS 설정을 위한 모듈
const mysql = require('mysql'); // MySQL 데이터베이스 모듈
const app = express(); // Express 앱 생성
const PORT = 5810; // 서버 포트 설정
// CORS 설정
const corsOptions = {
        origin: 'http://goodze.cafe24.com:5800', // 프론트엔드 서버 주소
        credentials: true, // 필요한 경우 설정 (예: 쿠키 공유)
    };
    app.use(cors(corsOptions)); // CORS 미들웨어 사용
    app.use(express.json()); // JSON 데이터 파싱을 위한 미들웨어 설정
    // MySQL 데이터베이스 연결 설정
    const dbConfig = {
        host: 'localhost',
        user: 'hj',
        password: 'leehj3982!',
        database: 'mydb'
    };
const connection = mysql.createConnection(dbConfig); // 데이터베이스 연결 생성
// 데이터베이스 연결 시도
connection.connect(error => {
    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('Connected to the database');
    }
});
// /api/data 엔드포인트 정의 - 데이터 조회
app.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM notice_board'; // SQL 쿼리문 작성
    // 데이터베이스 쿼리 실행
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error querying the database:', error);
            res.status(500).json({ error: 'Internal Server Error' }); // 에러 처리
        } else {
            res.json(results); // 결과를 JSON 형식으로 응답
        }
    });
});
// /api/data 엔드포인트 정의 - 데이터 입력
app.post('/api/data', (req, res) => {
    const { post_no, author_id, title, content, created_at } = req.body; // 요청 바디에서 데이터 추출
    // SQL 쿼리문 작성
    const query = 'INSERT INTO notice_board (post_no, author_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)';
    const values = [post_no, author_id, title, content, created_at]; // 쿼리에 전달할 값 배열
    // 데이터베이스 쿼리 실행
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            res.status(500).json({ error: 'Internal Server Error' }); // 에러 처리
        } else {
            res.json({ message: 'Data inserted successfully' }); // 성공 응답
        }
    });
});
// /api/data/:post_no 엔드포인트 정의 - 데이터 수정
app.put('/api/data/:post_no', (req, res) => {
    const post_no = req.params.post_no; // URL 파라미터에서 post_no 추출
    const { author_id, title, content, created_at } = req.body; // 요청 바디에서 데이터 추출
    const query = 'UPDATE notice_board SET author_id=?, title=?, content=?, created_at=? WHERE post_no=?'; // SQL 쿼리문 작성
    const values = [author_id, title, content, created_at, post_no]; // 쿼리에 전달할 값 배열
    // 데이터베이스 쿼리 실행
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error updating data:', error);
            res.status(500).json({ error: 'Internal Server Error' }); // 에러 처리
        } else {
            res.json({ message: 'Data updated successfully' }); // 성공 응답
        }
    });
});
// /api/data/:post_no 엔드포인트 정의 - 데이터 삭제
app.delete('/api/data/:post_no', (req, res) => {
    const post_no = req.params.post_no; // URL 파라미터에서 post_no 추출
    const query = 'DELETE FROM notice_board WHERE post_no=?'; // SQL 쿼리문 작성
    // 데이터베이스 쿼리 실행

      console.log("index_delete_"+`${post_no}`)
    connection.query(query, [post_no], (error, results) => {
        if (error) {
            console.error('Error deleting data:', error);
            res.status(500).json({ error: 'Internal Server Error' }); // 에러 처리
        } else {
            res.json({ message: 'Data deleted successfully' }); // 성공 응답
        }
    });
});
// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});