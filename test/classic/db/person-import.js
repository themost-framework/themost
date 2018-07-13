let randoms = require('./randoms');
let res = [];
for (let i=0;i<200;i++) {
    res.push(randoms.person());
}
console.log(JSON.stringify(res, null, 4));