import { users } from "./data.js";

// 반복문

// 숫자를 0부터 9까지 출력해보자.

// 반복문 방법1
console.log("시작");
let i = 0;
while (i < 10) {
  console.log(i);
  i++;
}
console.log("끝");

// 반복문 방법2
console.log("시작");
for (let i = 0; i < 10; i++) {
  console.log(i);
}
console.log("끝");

// 반복문 방법3
console.log("시작");
let j = 0;
while (true) {
  console.log(j);
  j++;
  if (j === 10) {
    break;
  }
}
console.log("끝");

// 실전 연습
const makeProfile = (user) => {
  if (user.isMarried === true) {
    return `프로필: ${user.name}님은 ${user.age}살입니다.(기혼)`;
  } else {
    return `프로필: ${user.name}님은 ${user.age}살입니다.(미혼)`;
  }
};

console.log("--------------------------------------------------");
// 유저 3명의 프로필 정보를 모두 출력하세요.
// 30000명일때도 동일한 코드로 출력할 수 있어야 합니다.
// 코드는 3줄로 작성하세요.
for (let i = 0; i < users.length; i++) {
  console.log(makeProfile(users[i]));
}

console.log("--------------------------------------------------");
// 유저 3명중에서 기혼자의 프로필 정보를 모두 출력하세요.
// 30000명일때도 동일한 코드로 출력할 수 있어야 합니다.
for (let i = 0; i < users.length; i++) {
  if (users[i].isMarried === true) {
    console.log(makeProfile(users[i]));
  }
}

console.log("--------------------------------------------------");
// 유저들의 평균 연령을 출력해주세요.
// 30000명일때도 동일한 코드로 출력할 수 있어야 합니다.
let ageSum = 0;
for (let i = 0; i < users.length; i++) {
  ageSum += users[i].age;
}
console.log(`유저들의 평균 연령: ${ageSum / users.length}`);

console.log("--------------------------------------------------");
// 미혼 유저들의 평균 연령을 출력해주세요.
// 30000명일때도 동일한 코드로 출력할 수 있어야 합니다.
let unmarriedAgeSum = 0;
let unmarriedUserCount = 0;
for (let i = 0; i < users.length; i++) {
  if (users[i].isMarried === false) {
    unmarriedAgeSum += users[i].age;
    unmarriedUserCount++;
  }
}
console.log(`미혼 유저들의 평균 연령: ${unmarriedAgeSum / unmarriedUserCount}`);
