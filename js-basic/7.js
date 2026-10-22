import { users } from "./data.js";
import PromptSync from "prompt-sync";

const makeProfile = (user) => {
  if (user.isMarried === true) {
    return `프로필: ${user.name}님은 ${user.age}살입니다.(기혼)`;
  } else {
    return `프로필: ${user.name}님은 ${user.age}살입니다.(미혼)`;
  }
};
const prompt = PromptSync()

console.log("--------------------------------------------------");
// 유저 3명의 프로필 정보를 모두 출력하세요.
// 30000명일때도 동일한 코드로 출력할 수 있어야 합니다.
// 코드는 3줄로 작성하세요.
for (let i = 0; i < users.length; i++) {
  console.log(makeProfile(users[i]));
}

// 나이가 27살인 유저 1명로부터 이름, 결혼 여부를 입력받아보세요.
// 그 유저의 정보를 users 배열에 추가해주세요.
// 4명의 유저 모두의 프로필을 출력해주세요.
const inputAge = Number(prompt("나이가 몇살인가요?: "));
const inputName = prompt("이름이 뭐에요?: ");
const inputIsMarried = prompt("결혼을 했나요? (y/n): ") === "y";

const user4 = { 
  name: inputName,
  age: inputAge,
  isMarried: inputIsMarried
};

users.push(user4);

console.log("--------------------------------------------------");
for (let i = 0; i < users.length; i++) {
  console.log(makeProfile(users[i]));
} 
