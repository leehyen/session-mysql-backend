const express = require('express');
const session = require('express-session'); //★세션설정 : 세션패키지사용
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const PORT = process.env.PORT || 3000;
// CORS 설정
const corsOptions = {
    origin: process.env.CLIENT_URL,// 프론트엔드 서버의 주소
    credentials: true, // 필요한 경우 설정 (예: 쿠키 공유)
};
app.use(cors(corsOptions));
app.use(express.json());
// ★세션설정
// 이 설정은 Express 애플리케이션에 세션 미들웨어를 추가하고, 세션을 초기화하는데 필요한 옵션을 설정한다.
// secret는 세션 암호화를 위한 시크릿 키로, 실제 프로덕션 환경에서는 보안을 강화하기 위해 더 강력한 비밀 키를 사용해야 한다.
// resave와 saveUninitialized 옵션은 세션 설정의 세부 사항을 제어하는데 사용된다.
// 이 설정을 추가하면 Express 애플리케이션이 클라이언트와 서버 간의 세션 관리를 지원하게 된다.
// app.use(session(...)) 설정은 Express 미들웨어로서, 서버가 실행될 때마다 실행된다.
// 서버가 시작될 때 세션 설정을 초기화하고, 클라이언트 요청이 들어올 때마다 해당 세션 설정을 사용하여 세션을 처리한다.
app.use(session({
    secret: process.env.SESSION_SECRET, // 세션 암호화를 위한 시크릿 키 
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000, // 세션 쿠키의 유효 시간 (예: 1시간)
        secure: process.env.SESSION_SECRET==="true", // HTTPS를 사용하지 않을 경우 false로 설정 http도 사용가능(false #dev,true #prod)
        // ===이란,자바스크립트에서 문자열 "true"와 비교해서 같으면 true (불리언), 다르면 false
        sameSite: 'strict', // 쿠키가 동일한 출처에서만 전송되도록 함, 가장 엄격한 설정
    },
}));
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};
const connection = mysql.createConnection(dbConfig);
connection.connect(error => {
    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('Connected to the database');
    }
});
// ★세션설정 /api/login 엔드포인트 정의 - 로그인
app.post('/api/login', (req, res) => {
    const { post_no } = req.body; // 클라이언트에서 전송한 post_no
    // 데이터베이스에서 post_no 확인
    const query = 'SELECT * FROM stdinfo WHERE post_no = ?';
    connection.query(query, [post_no], (queryError, results) => {
        if (queryError) {
            console.error('Error querying the database:', queryError);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length === 0) {
            // post_no 데이터베이스에 없는 경우
            res.status(401).json({ error: 'Invalid Student Number' });
        } else {
            // post_no 데이터베이스에 있는 경우 세션에 저장
            req.session.post_no = post_no;
            // 클라이언트에 세션 쿠키를 설정
            res.cookie('sessionID', req.sessionID, {
                maxAge: 3600000, 
                httpOnly: true, // JavaScript에서 쿠키에 접근하는 것을 방지 보안강화
                secure: false, 
                sameSite: 'strict', 
            });
            res.json({ message: 'Login successful' });
        }
    });
});

// ★/api/logout 엔드포인트 정의 - 로그아웃
app.post('/api/logout', (req, res) => {
    if (req.session.post_no) {
        // post_no 세션 데이터만 삭제
        delete req.session.post_no;
        res.json({ message: 'Logout successful' });
    } else {
        res.json({ message: 'Already logged out' });
    }
});

// ★/api/check-login 엔드포인트 정의 - 세션 상태 확인
app.get('/api/check-login', (req, res) => {
    // 세션에 post_no 있는지 확인하여 세션 상태를 응답
    const isLoggedIn = !!req.session.post_no;
    // x가 존재하고 비어있지 않으면 !!x는 true가 되고, 값 x가 존재하지 않거나 비어 있으면 false가 됨
    res.json({ isLoggedIn });
});
app.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM notice_board';
        connection.query(query, (error, results) => {
        if (error) {
            console.error('Error querying the database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
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
    const values =  [author_id, title, content, created_at, post_no];// 쿼리에 전달할 값 배열
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
    connection.query(query, [post_no], (error, results) => {
        if (error) {
            console.error('Error deleting data:', error);
            res.status(500).json({ error: 'Internal Server Error' }); // 에러 처리
        } else {
            res.json({ message: 'Data deleted successfully' }); // 성공 응답
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});