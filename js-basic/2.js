// 참조값
// : 객체: 다른 종류의 데이터를 여러개 모아서 사용하는 컨테이너
// : 배열: 같은 종류의 데이터를 여러개 담아서 사용하는 컨테이너

// 객체(Object)
const user1 = {
  name: "김민수",
  age: 25,
  isMarried: true,
};
console.log(`프로필: ${user1.name}님은 ${user1.age}살입니다.`);

const user2 = {
  name: "김민지",
  age: 21,
  isMarried: false,
};
console.log(`프로필: ${user2.name}님은 ${user2.age}살입니다.`);

// 배열(Array)
const users = [user1, user2];
console.log(users);
console.log(`현재 유저는 총 ${users.length}명입니다.`);
// users[인덱스]
console.log(`프로필: ${users[0].name}님은 ${users[0].age}살입니다.`);
console.log(`프로필: ${users[1].name}님은 ${users[1].age}살입니다.`);

const user3 = {
  name: "김민정",
  age: 19,
  isMarried: false,
};
users.push(user3);
console.log(users);
console.log(`현재 유저는 총 ${users.length}명입니다.`);
console.log(`프로필: ${users[0].name}님은 ${users[0].age}살입니다.`);
console.log(`프로필: ${users[1].name}님은 ${users[1].age}살입니다.`);
console.log(`프로필: ${users[2].name}님은 ${users[2].age}살입니다.`);
