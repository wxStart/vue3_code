export function getSequence(arr) {
    const result = [0];
    let p = result.slice(0); // 记录操作每个元素的前一个元素的的时候前一个的index    p是一个hash数组

    const len = arr.length;
    let start = 0;
    let end = result.length - 1;
    let minddle;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        const resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          p[i] = result[result.length - 1]; // 当前数据的前一个 下标
          result.push(i);
        //   console.log('result: p',i, JSON.stringify(result), JSON.stringify(p));
          continue;
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
          minddle = ((start + end) / 2) | 0;
          if (arr[result[minddle]] < arrI) {
            start = minddle + 1;
          } else {
            end = minddle;
          }
        }
        if (arrI < arr[result[start]]) {
          p[i] = result[start - 1]; // 找到这个节点替换的节点的前一个
          result[start] = i;
        }
      }
    //   console.log('result: p',i, JSON.stringify(result), JSON.stringify(p));
    }

    /*
        arr =[2, 3, 1, 5, 6, 8, 7, 9, 4]
        // 2    resutl=[0] p=[0]
        // 2,3  resutl=[0,1] p=[0,0]
        // 1,3  resutl=[2,1] p=[0,0,undefined,]
        // 1,3,5   resutl=[2,1,3] p=[0,0,undefined,1]
        // 1,3,5,6,  resutl=[2,1,3,4] p=[0,0,undefined,1,3]
        // 1,3,5,6,8 resutl=[2,1,3,4,5] p=[0,0,undefined,1,3,4]
        // 1,3,5,6,7 resutl=[2,1,3,4,6] p=[0,0,undefined,1,3,4,4]
        // 1,3,5,6,7,9 resutl=[2,1,3,4,6,7] p=[0,0,undefined,1,3,4,4,6]
        // 1,3,4,6,7,9  resutl=[2,1,8,4,6,7] p=[0,0,undefined,1,3,4,4,6,1]
        result = [2,1,8,4,6,7]
        p= []
     */
    // result =[]
    // console.log('result: p', result,p);

    let rlen = result.length;
    let last = result[rlen - 1]; // 这个是 arr下标
    while (rlen-- > 0) {
      result[rlen] = last;
      last = p[last]; //  p里面放的arr每个下标对应的前一个下标
    }
    return result;
  }