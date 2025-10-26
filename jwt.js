
const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) =>{
    const  authorization = req.cookies.token;
    console.log(authorization);
    console.log('-----------');
  
   
    try {
        const secret =  req.body.jwt ? req.body.jwt : process.env.JWT_SECRET_KEY; 
        const decoded = jwt.verify(authorization, secret);
        console.log('++++++++++++++++');
        console.log(decoded);
        req.user = decoded; // Store the decoded user info in the request object
        next();
    } catch (error) {
        console.log("Thanks");
        return res.redirect('/login'); // Redirect to login if token is invalid
    }
}

const generate = (id ,user,role) => {
    const payload = {
        id,

   
        username: user,
        role
    };

    const options = {
        expiresIn: '1h',  // Token will expire in 1 hour
        algorithm: 'HS256',
        issuer: 'my_app',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, options);
    return token;
};

module.exports = {verifyToken,generate,jwt};

