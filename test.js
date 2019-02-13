class TestClass {
    constructor() {
    }

    normalFunction(){
        console.log('normal function running');
        console.log(this)
        this.asyncFunction()
    }

    async asyncFunction(){
        console.log('normal function running');
        console.log(this)
        await sleep(1000)
        console.log('normal function after await running');
        console.log(this)
        this.statusFunction('calling from async')
        this.asyncFunction()
    }

    statusFunction(status){
        console.log(status);
    }


}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testObject = new TestClass()
testObject.normalFunction()