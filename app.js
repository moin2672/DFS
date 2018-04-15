var express = require('express'); 
var app = express(); 

var bodyParser = require('body-parser');
var mongoose = require('mongoose');
nodeMailer = require('nodemailer');

mongoose.connect("mongodb://syed:syed@ds117749.mlab.com:17749/fileupload");
var conn = mongoose.connection;

var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);

const methodOverride=require('method-override');

/** Seting up server to accept cross-origin browser requests */
app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({	extended: true })); // support encoded bodies

app.use(methodOverride('_method'));

/** Setting up storage using multer-gridfs-storage */
var storage = GridFsStorage({
    gfs : gfs,
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    },
    /** With gridfs we can store aditional meta-data along with the file */
    metadata: function(req, file, cb) {
        cb(null, { 
            originalname: file.originalname,
            userName:req.body.userName,
            attachmentDescription: req.body.attachmentDescription,
            deleteCode:req.body.deleteCode,
            views:0,
            reviews:[]
         });
    },
    root: 'ctFiles' //root name for collection to store files into
});

var upload = multer({ //multer settings for single upload
    storage: storage
}).single('file');


app.set('view engine', 'ejs');
 
app.get('/upload', (req, res)=>{
    res.render('upload');
});
app.get('/error', (req, res)=>{
    res.render('error');
});




app.get('/',(req, res)=>{
    //res.render('index');
    gfs.collection('ctFiles'); //set collection name to lookup into
    
        /** First check if file exists */
        gfs.files.find().sort({uploadDate:-1}).limit(12).toArray((err, files)=>{
            if(!files || files.length===0){
                res.render('index',{files:false});
            } else {
                files.map(file=>{
                    if(file.contentType==='image/png'|| file.contentType==='image/jpeg'){
                        file.isImage=true;
                    } else {
                        file.isImage=false;
                    }
                    if(file.contentType==='video/mp4'){
                        file.isVideo=true;
                    } else {
                        file.isVideo=false;
                    }
                    if(file.contentType==='application/pdf'){
                        file.isPDF=true;
                    } else {
                        file.isPDF=false;
                    }
                    
                });
                res.render('index',{files: files})
            }
        });
        
});



/** API path that will upload the files */
app.post('/upload', function(req, res) {
    upload(req,res,function(err){
        if(err){
             res.json({error_code:1,err_desc:err});
             return;
        }
         //res.json({error_code:0,err_desc:null});
         res.redirect('/');
    });
});

app.get("/search",(req,res)=>{
    res.redirect("/");
});

app.post("/search", (req,res) =>{
    console.log(req.body);
    var name=req.body.search;
    var regexValue = '\.*'+name.toLowerCase().trim()+'\.*';
    const CheckValue =new RegExp(regexValue,'i');
        //const regex = new RegExp(name.toLowerCase().trim(), 'i')
        console.log(regexValue);   
        gfs.files.find({$or:[{'metadata.userName': CheckValue},{'metadata.originalname': CheckValue},{'metadata.attachmentDescription': CheckValue}]}).sort({uploadDate:-1}).toArray(function(err, files){
            if(!files || files.length===0){
                res.render('index',{files:false});
            } else {
                files.map(file=>{
                    if(file.contentType==='image/png'|| file.contentType==='image/jpeg'){
                        file.isImage=true;
                    } else {
                        file.isImage=false;
                    }
                    if(file.contentType==='video/mp4'){
                        file.isVideo=true;
                    } else {
                        file.isVideo=false;
                    }
                    if(file.contentType==='application/pdf'){
                        file.isPDF=true;
                    } else {
                        file.isPDF=false;
                    }
                });
                res.render('index',{files: files})
            }
        });
});
app.post("search/search", (req,res) =>{
    console.log(req.body);
    var name=req.body.search;
    var regexValue = '\.*'+name.toLowerCase().trim()+'\.*';
    const CheckValue =new RegExp(regexValue,'i');
        //const regex = new RegExp(name.toLowerCase().trim(), 'i')
        console.log(regexValue);   
        gfs.files.find({$or:[{'metadata.userName': CheckValue},{'metadata.originalname': CheckValue},{'metadata.attachmentDescription': CheckValue}]}).sort({uploadDate:-1}).toArray(function(err, files){
            if(!files || files.length===0){
                res.render('index',{files:false});
            } else {
                files.map(file=>{
                    if(file.contentType==='image/png'|| file.contentType==='image/jpeg'){
                        file.isImage=true;
                    } else {
                        file.isImage=false;
                    }
                    if(file.contentType==='video/mp4'){
                        file.isVideo=true;
                    } else {
                        file.isVideo=false;
                    }
                    if(file.contentType==='application/pdf'){
                        file.isPDF=true;
                    } else {
                        file.isPDF=false;
                    }
                });
                res.render('index',{files: files})
            }
        });
});

app.post("/files/:id/:filename", (req, res) => {
    
       gfs.collection('ctFiles');            
            gfs.files.find({filename: req.params.filename, "metadata.deleteCode":req.body.deleteCode}).toArray(function(err, files){
                if(!files || files.length === 0){
                   return res.status(404).render('Invalidcode');//json({err:'Invalid Deletion code'});
                }
                gfs.remove({
                    _id: req.params.id, 
                    'metadata.deleteCode':req.body.deleteCode, 
                    root:'ctFiles'}, (err, gridStore) => {
                    if(err){
                        return res.status(404).json({err:err});
                        
                    }
                    res.redirect('/');
                });
            });
 });
 

/* VERY IMPORTANT ONE NEED TO WORK ON THIS */

app.delete('/files/:id', (req,res) => {
   gfs.remove({
        _id: req.params.id, 
        'metadata.deleteCode':req.body.deleteCode , 
        root:'ctFiles'}, (err, gridStore) => {
        if(err){
            return res.status(404).json({err:err});
        }
       // res.redirect('/');
       return res.status(200).json({ _id: req.params.id, 
        'metadata.deleteCode':req.body.deleteCode});
    });
});




app.get('/files/:filename', (req,res) => {
    gfs.collection('ctFiles'); //set collection name to lookup into
          
              /** First check if file exists */
              gfs.files.find({filename: req.params.filename}).toArray((err, files)=>{
                  if(!files || files.length===0){
                      res.render('index',{files:false});
                  } else {
                      files.map(file=>{
                          if(file.contentType==='image/png'|| file.contentType==='image/jpeg'){
                              file.isImage=true;
                          } else {
                              file.isImage=false;
                          }
                          if(file.contentType==='video/mp4'){
                              file.isVideo=true;
                          } else {
                              file.isVideo=false;
                          }
                          if(file.contentType==='application/pdf'){
                              file.isPDF=true;
                          } else {
                              file.isPDF=false;
                          }
                          
                      });
                      res.render('file',{files: files})
                  }
              });
              
              gfs.files.update({filename:req.params.filename},{$inc:{'metadata.views':1}}, function(err, result){
                if(err){
                    console.log('got some error');
                }
            })
});

app.post('/review/:filename',(req,res)=>{
    
   gfs.collection('ctFiles'); //set collection; name to lookup into
    
    gfs.files.update({filename:req.params.filename},{$addToSet:{'metadata.reviews':{rName:req.body.rName,rComment:req.body.rComment}}}, function(err, result){
        if(err){
            console.log('got some error');
        }
res.redirect('/files/'+req.params.filename);

    })

});

app.post('/mail/:filename',(req, res) => {
    console.log(req.body);
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'deysfilesharer@gmail.com ',
            pass: 'Deys@1234'
        }
    });
    var sendLink="https://ancient-lowlands-63879.herokuapp.com/files/"+req.params.filename;
    let mailOptions = {
        from: '"DFS Admin Team" <xx@gmail.com>', // sender address
        to: req.body.emailID, // list of receivers
        subject: req.body.mailerName+' shared a file with you', // Subject line
        
        html: '<p style="color: #800080;margin-bottom:-5px;"><small style="font-size:26px;">&nbsp; DEYS</small> <br><small><span> FILE SHAREPOINT</span></small></p>  <br>Your friend has shared a file with you. <br><br> <a href='+sendLink+'>click on it to check the file</a><br> <br> <p>Regards,<br><b>DFS Team</b></p>'// html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
            res.redirect('/files/'+req.params.filename);
        });
});


app.post('/files/:filename', (req, res)=> {
    // console.log('inside function');
     gfs.collection('ctFiles'); //set collection; name to lookup into
     //console.log(req.params.filename);
     gfs.files.update({filename:req.params.filename},{$inc:{'metadata.views':1}}, function(err, result){
         if(err){
             console.log('got some error');
         }
         //res.json(result);
     })
 });

app.get('/files/file/:filename', function(req, res){
    gfs.collection('ctFiles'); //set collection name to lookup into

    /** First check if file exists */
    gfs.files.find({filename: req.params.filename}).toArray(function(err, files){
        if(!files || files.length === 0){
            return res.status(404).json({
                responseCode: 1,
                responseMessage: "error"
            });
        }
        /** create read stream */
        var readstream = gfs.createReadStream({
            filename: files[0].filename,
            root: "ctFiles"
        });
        /** set the proper content type */
        res.set('Content-Type', files[0].contentType)
        /** return response */
        return readstream.pipe(res);
    });
});

app.get('/file/:filename', function(req, res){
    gfs.collection('ctFiles'); //set collection name to lookup into

    /** First check if file exists */
    gfs.files.find({filename: req.params.filename}).toArray(function(err, files){
        if(!files || files.length === 0){
            return res.status(404).json({
                responseCode: 1,
                responseMessage: "error"
            });
        }
        /** create read stream */
        var readstream = gfs.createReadStream({
            filename: files[0].filename,
            root: "ctFiles"
        });
        /** set the proper content type */
        res.set('Content-Type', files[0].contentType)
        /** return response */
        return readstream.pipe(res);
    });
});


var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function() {
console.log("Listening on Port 3000");
});


