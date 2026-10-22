import PromptSync from "prompt-sync";

const prompt = PromptSync();

const users = [];
    
while (true) {
    
    const menu = prompt(`메뉴: 로그인 , 회원가입 , 종료 (현재 회원수: ${users.length}명): `);

    if (menu === "로그인") {
        console.log("로그인완료");
    } else if (menu === "회원가입") { 
        
        const inputEmail = prompt("이메일: ");
        const inputPassword = prompt("비밀번호: ");
        const inputName = prompt("이름: ");
        const inputAge = Number(prompt("나이: "));
        const inputMarried = prompt("결혼 여부 (y/n): ");
        const isMarried = inputMarried === "y" ? "기혼" : "미혼";

        const user = {
            email: inputEmail,
            password: inputPassword,
            name: inputName,
            age: inputAge,
            isMarried: isMarried
        };               

        console.log(user);

        const existingUser = users.find(u => u.email === inputEmail);
        if (existingUser) {
            console.log("이미 존재하는 계정입니다.");
        } else {
            console.log("회원가입 완료");
            users.push(user);
        }
    } else if (menu === "종료") {
        console.log("프로그램을 종료합니다.");
        break;
    } else {
        console.log("입력이 잘못되었습니다.");
    }

  }