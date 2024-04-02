const axios = require('axios');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

module.exports = async (url, token, method) => {
    let res = await axios({
        url: `${url}`,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    })
    return res;
}