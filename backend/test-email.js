const { send2FACode } = require('./emailService');

async function test() {
    try {
        console.log('Testing email sending to xxxsolarix@gmail.com...');
        await send2FACode('xxxsolarix@gmail.com', '123456');
        console.log('Test successful!');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
