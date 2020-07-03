const serverless = require('serverless-http');
const express = require('express');
const moment = require('moment');
const _ = require('underscore');
const uuidv4 = require('uuid/v4');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const AWS = require('aws-sdk');
const md5 = require('md5');
// AWS.config.update({ region: 'us-east-2' });

AWS.config.accessKeyId = 'AKIAYFG3BHFBL7ZQGG4U'
AWS.config.secretAccessKey = '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'
AWS.config.region = 'us-east-2'


docClient = new AWS.DynamoDB.DocumentClient();

const tableName =  'rd_users';

router.post('/api/login',[    
    check('email', 'Email is not valid').isEmail(),    
    check('password', 'Password field is required').not().isEmpty(),      
    check('password').isLength({ min: 5 }).withMessage('Must be at least 5 chars long')
], (req, res, next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
   
    docClient.scan({
        TableName: tableName,
        FilterExpression:  "email = :eid AND password = :pwd ",
        ExpressionAttributeValues: {
                ":eid": req.body.email,
                ":pwd":md5(req.body.password)
            }
        }, (err, data)=>{
            if(err) {
                console.log("LOGIN: "+err);
                return res.status(err.statusCode).send({
                    message: err.message,
                    status: err.statusCode
                });
            } else {
                // console.log("RESULT LOGIN: "+JSON.stringify(data));
                if(data.Count==0){
                    return res.status(400).send({
                        "operation":"login",
                        "status":"failed",
                        "message":"Unable to login"
                    });
                }else{
                    return res.status(200).send(
                        {
                            "operation":"login",
                            "status":"success",
                            "userinfo":data.Items[0],                       
                        });
                }
                
            }
        });

  
});

router.post('/api/register',[    
        check('email', 'Email is not valid').isEmail(),
        check('name', 'Username field is required').not().isEmpty(),
        check('password', 'Password field is required').not().isEmpty(),      
        check('password').isLength({ min: 5 }).withMessage('Must be at least 5 chars long')
    ], (req, res, next)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
   
    let newId= uuidv4();
    let itemObj = {
        _id: newId,
        email: req.body.email,
        name: req.body.name?req.body.name:'null',
        address: req.body.address?req.body.address:'null',
        phone: req.body.phone?req.body.phone:'null',
        password:md5(req.body.password)        
    }
      
    checkIfEmailAlreadyExists(req.body.email,function(err, isExists){
        // console.log("Email isExists: "+isExists);
  
            if(isExists){
                return res.status(400).send({
                    operation:"register",
                    status:"failed",
                    message:"Already registered with this email id"
                });
            }else{
                docClient.put({
                    TableName:tableName,
                    Item: itemObj
                }, (err, data)=>{
                    if(err) {
                        console.log(err);
                        return res.status(err.statusCode).send({
                            message: err.message,
                            status: err.statusCode
                        });
                    } else {
                        return res.status(200).send(
                            {
                                "operation":"register",
                                "status":"success",
                                "userinfo":itemObj});
                    }
                });
            }
    });
});

function checkIfEmailAlreadyExists(email,callback){
    let result=false;
    docClient.scan({
        TableName: tableName,
        FilterExpression: "email = :eid",
        ExpressionAttributeValues: {
            ":eid": email
        }
    }, (err, data)=>{
        if(err) {
            console.log("checkIfEmailAlreadyExists ERROR: "+err);
            callback("error");
        } else {        
            let resObj=data;
            console.log("count: "+resObj.Count);
            
            if(resObj){
                result = resObj.Count>0 ? true :false 
                callback(null,result);
            }       
        }
    });

}

router.post('/api/resetpassword',[   
    check('_id', 'User Id is required').not().isEmpty(), 
    check('email', 'Email is is required').isEmail(),     
    check('password', 'Password field is required').not().isEmpty(),      
    check('password').isLength({ min: 5 }).withMessage('Must be at least 5 chars long')   
], (req, res, next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    docClient.update({
        TableName: tableName,
        Key: {
            _id: req.body._id,
            email: req.body.email
        },
        UpdateExpression: 'set #t = :t',
        ExpressionAttributeNames: {
            '#t': 'password'
        },
        ExpressionAttributeValues: {
            ':t': md5(req.body.password)
        }
    }, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            console.log("RESET PWD: "+JSON.stringify(data,null,2));
            return res.status(200).send(
                {
                    "operation":"resetpassword",
                    "status":"success"
                });
        }
    });
});


router.put('/api/updateuser',[   
    check('_id', 'User Id is required').not().isEmpty(), 
    check('email', 'Email is is required').isEmail()   
], (req, res, next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let itemObj = {
        _id: req.body._id,
        email: req.body.email,
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone      
    }
    docClient.update({
        TableName: tableName,
        Key: {
            _id: req.body._id,
            email: req.body.email
        },
        UpdateExpression: 'set #n = :n , #addr = :addr , #p = :p',
        ExpressionAttributeNames: {
            '#n': 'name',
            "#addr":'address',
            "#p":'phone'
        },
        ExpressionAttributeValues: {
            ':n': req.body.name,
            ':addr':req.body.address,
            ':p':req.body.phone,
        }
    }, (err, data)=>{
        if(err) {
            console.log(err);
            return res.status(err.statusCode).send({
                message: err.message,
                status: err.statusCode
            });
        } else {
            console.log("UPDATE USER: "+JSON.stringify(data,null,2));
            return res.status(200).send(
                {
                    "operation":"updateuser",
                    "status":"success",
                    "userinfo":itemObj
                });
        }
    });
});

// module.exports.handler = serverless(app);
module.exports = router;