const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const con = mysql.createConnection({
    host:'localhost',
    user: 'saumani',
    password: 'saumani',
    database: 'notes_01'
});

const app = express();
const urlenc = express.urlencoded({extended:false});

app.use(session({
    secret: 'secret...',
    resave:true,
    saveUninitialized:true,
    maxAge: 3600000
}));
app.use(express.static('./src'));
app.set('views','./src');
app.set('view engine', 'ejs');

//Login Page
app.get('/',(req,res)=>{
    res.render('login',{
        msg:'',
        clr:''
    });
});

app.post('/',urlenc,(req,res)=>{
    let email = req.body.email;
    let passwd = req.body.passwd;
    let qry = "Select * from users where emailid='"+email+"';";
    con.query(qry,(err0,rows)=>{
        if(err0) throw err0;
        bcrypt.compare(passwd,rows[0].password,(err1,resp)=>{
            if(err1) throw err1;
            if(resp){
                req.session.uname = rows[0].uname;
                req.session.email = rows[0].emailid;
                res.redirect('/welcome');
            }else{
                res.render('login',{
                    msg:'Invalid mail id or password...',
                    clr:'msg-red'
                });
            }
        });
    });
    
});

//Signup page
app.get('/signup',(req,res)=>{
    res.render('signup',{
        msg:'',
        clr:''
    });
});
app.post('/signup',urlenc,(req,res)=>{
    let uname = req.body.uname;
    let email = req.body.email;
    let passwd = req.body.passwd;
    let password = bcrypt.hash(passwd,10,(err,hashed_password)=>{
        if(err) throw err;
        let qry = "Insert into users values ('"+uname+"','"+email+"','"+hashed_password+"');";
        con.query(qry,(err)=>{
            if(err){
            //throw err;
            let msg = String(err);
            console.log(msg);
            if(msg.includes('Error: ER_DUP_ENTRY: Duplicate entry')){
                console.log("Duplicate user...");
                msg = "The user that you are trying to create already exist...";
            }
            res.render('signup',{
                msg:msg,
                clr:'msg-red'
            });
            }
            else{
                let msg = "User "+uname+" has been created..."
                console.log(msg);
                res.render('signup',{
                    msg: msg,
                    clr:'msg-green'
                });
            }
        });
    });
    console.log(password);  
    
});

//Welcome Page
app.get('/welcome',(req,res)=>{
    if(req.session.uname){
        let qry = "Select * from notes where emailid='"+req.session.email+"';"
        con.query(qry,(err,rows)=>{
            if(err) throw err;
            res.render('welcome',{
                usr:req.session.uname,
                rows: rows
            });
        });
    }else{
        res.redirect('/');
    }
});

//new-notes
app.get('/NewNotes',(req,res)=>{
    if(req.session.uname){
            res.render('new-notes',{
            msg:'',
            clr:'',
            usr:req.session.uname
        });
    }else{
        res.redirect('/');
    }
});
app.post('/NewNotes',urlenc,(req,res)=>{
    if(req.session.uname){
        let title = req.body.ntsTtl;
        let notes = req.body.nts;
        let usr = req.session.email;
        let query = "Insert into notes (emailid,title,notes) values ('"+usr+"','"+title+"','"+notes+"');";
        con.query(query,(err)=>{
            if(err){
                res.render('new-notes',{
                    msg:'Note has been saved...',
                    clr:'msg-green',
                    usr:err
                });
            } else{
                res.render('new-notes',{
                    msg:'Note has been saved...',
                    clr:'msg-green',
                    usr:req.session.uname
                });
            }
            
        });        
    }else{
        res.redirect('/');
    }
});

//edit-notes
app.get('/edit-notes',(req,res)=>{
    if(req.session.uname){
        let{id} = req.query;
        let qry = "Select * from notes where notesid="+id;
        con.query(qry,(err,rows)=>{
            if(err) throw err;
            res.render('edit-notes',{
                usr:req.session.uname,
                title:rows[0].title,
                note: rows[0].notes,
                msg:'',
                clr:''
            });
        });
    }else{
        res.redirect('/');
    }
    
});
app.post('/edit-notes',urlenc,(req,res)=>{
    if(req.session.uname){
        let{id} = req.query;
        let qry = "Update notes set title='"+ req.body.ntsTtl+"',notes='"+req.body.nts+"' where notesid="+id;
        con.query(qry,(err,rows)=>{
            if(err) throw err;
            qry = "Select * from notes where notesid="+id;
            con.query(qry,(err,rows)=>{
                if(err) throw err;
                res.render('edit-notes',{
                    usr:req.session.uname,
                    title:rows[0].title,
                    note: rows[0].notes,
                    msg:'Note Updated...',
                    clr:'msg-green'
                });
            });
    });
    }else{
        res.redirect('/');
    }
    
});
app.get('/delete-notes',(req,res)=>{
    if(req.session.uname){
        let {id} = req.query;
        let qry = "delete from notes where notesid="+id;
        con.query(qry,(err)=>{
            if(err) throw err;
            res.redirect('/welcome');
        });
    }else{
        res.redirect('/');
    }
});
//logout
app.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        console.log('logged out...');
    });
    res.redirect('/');
});

app.listen(3000,()=>{
    console.log('App is running in port 3000');
});

