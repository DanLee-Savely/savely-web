import { users } from "./data.js";

// 조건문
if (users[0].isMarried === true) {
  console.log(`프로필: ${users[0].name}님은 ${users[0].age}살입니다.(기혼)`);
} else {
  console.log(`프로필: ${users[0].name}님은 ${users[0].age}살입니다.(미혼)`);
}

if (users[1].isMarried === true) {
  console.log(`프로필: ${users[1].name}님은 ${users[1].age}살입니다.(기혼)`);
} else {
  console.log(`프로필: ${users[1].name}님은 ${users[1].age}살입니다.(미혼)`);
}

if (users[2].isMarried === true) {
  console.log(`프로필: ${users[2].name}님은 ${users[2].age}살입니다.(기혼)`);
} else {
  console.log(`프로필: ${users[2].name}님은 ${users[2].age}살입니다.(미혼)`);
}
