/*
 *  a 
 *
 * @author Ryan Ferner
 */

// Initialize Firebase

var RussianHackerMode= false; // if true, can see and edit everything except participate in a game because it wouldn't make sense


  var config = {
    apiKey: "AIzaSyDPMdXtVxtM6TlH64-T0pSfV4r6emvkz94",
    authDomain: "rjf19-elo.firebaseapp.com",
    databaseURL: "https://rjf19-elo.firebaseio.com",
    projectId: "rjf19-elo",
    storageBucket: "rjf19-elo.appspot.com",
    messagingSenderId: "783957939775"
  };

function moveFbRecord(oldRef, newRef) {    // thank you to GitHub user katowulf at https://gist.github.com/katowulf/6099042
     oldRef.once('value', function(snap)  {  //takes the snapshot value at the old ref
          newRef.set( snap.val(), function(error) {  // and sets the value at the new ref, and
               if( !error ) {  oldRef.remove(); }// If it's not an error, goes ahead and sets the old ref to null
          });
     });
}

function calculateExpectedResult(elo1,elo2){
    adjustedDifference = (elo2-elo1)/400;
    return 1/(1+Math.pow(10,adjustedDifference))
}

function calculateNewElo(elo1, elo2, result, kval) {
    return elo1+kval*(result-calculateExpectedResult(elo1,elo2));
}





function presenttime(){  // just gets the present time, I lifted this from my trello
    var today = new Date();
    var hr = today.getHours();
    var min = today.getMinutes();
    if (min < 10){
        min = "0" + min;
    }
    if (hr < 10){
        hr = "0" + hr;
    }

    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yy = today.getFullYear();
    if (dd < 10){
        dd = "0" + dd;
    }
    if (mm < 10){
        mm = "0" + mm;
    }
    return (yy+"-"+mm+"-"+dd +" " + hr + ':' + min);
}



var db = firebase.initializeApp(config).database();
// global reference to remote data
var storageRef = firebase.storage().ref();
// global reference to remote data
var projectsRef = db.ref('projects');
var usersRef = db.ref('users');
var gamesRef = db.ref('games');
var agentsRef = db.ref('agents');
var histRef = db.ref('hist');
// connect Firebase to Vue
Vue.use(VueFire);




var app = new Vue({
    // not entirely dissimilar

    
    data: {  
        screen: "help",
        role: "guest",
        logged: false,
        
        
        loggedIn:{
                name: "Anonymous",
                photo: "./data/pic.png",
                id: -1,
                notifications: 0
                
            } ,
        
        newusername: "",
        newpassword: "",
        confirmpassword: "",
        
        oldusername: "",
        oldpassword: "",
        
        editusername: "",
        editpassword: "",
        
        newProjName: "",
        newK: 30,
        newPrivacy: "private",
        newEditPrivs: "owner only",
        newOwnerIsAgent: "No",
        
        agentList: [],
        usersList: [],
        
        currentProject:{
            id: "",
            name: "",
            created: "",
            kval: "",
            edit: "",
            view: "",     
            owner: ""
        },
        
        editAgentsOn: false,
        
        oldAgentElo: 1000,
        newAgentElo: 1000,
        newAgent: "",
        newAgentUser: "Not a User",
        editUsersOn: false,
        newUserName: "",
        showNotifications: false,
        ff: "true",
        
        gameAgent1: "Select an Agent",
        gameAgent2: "Select an Agent",
        outcome: "",
        
        editK: 0,
        editPrivacy: "",
        editProjName: "",
        editEditPrivs: "",
        notifications: []
        
        
        
        
        
    },
    firebase: {
        projects: projectsRef,
        users: usersRef,
        games: gamesRef,
        agents: agentsRef,
        hist: histRef
    },

    // methods that can be called from within HTML code, typically through input elements
    computed:{
        sortedAgents(){
            list = this.agentList;
            return list.sort(function(a,b){
                return b.elo-a.elo;
            });
        },
        expectation(){
            return 0;
        },
        p1WinRate(){
            p1Percent = calculateExpectedResult(app.gameAgent1.elo,app.gameAgent2.elo);
            p1Percent = Math.round(p1Percent*100)/100
            return (p1Percent*100)+"%"
        },
        p2WinRate(){
            p1Percent = calculateExpectedResult(app.gameAgent2.elo,app.gameAgent1.elo);
            p1Percent = Math.round(p1Percent*100)/100
            return (p1Percent*100)+"%"
        },
        p1WinChange(){
            return Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,1, app.currentProject.kval));
        },
        p2WinChange(){
            return Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,1, app.currentProject.kval));
        },
        p1LossChange(){
            return Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,0, app.currentProject.kval));
        },
        p2LossChange(){
            return Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,0, app.currentProject.kval));
        },
        p1TieChange(){
            return Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,.5, app.currentProject.kval));
        },
        p2TieChange(){
            return Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,.5, app.currentProject.kval));
        },
        sortedGames(){
            
            var gg = [];
            for (game in app.games){
                gg.push(app.games[game]);
            }
            gg.sort(function(a,b){
                return b.time-a.time;
            })
            return gg;
            
        },
        userIsAgent(){
            for (agent in app.agentList){
                if (agent.user === app.loggedIn.name){
                    return true;
                }
            }
            return false;
        },
        playerAgent(){
            for (agent in app.agentList){
                if (app.agentList[agent].user === app.loggedIn.name){
                    app.gameAgent1 = app.agentList[agent];
                    return app.agentList[agent];
                }
               
                
            }
        },
        sortNotifications(){
            if (!app.logged){
                return [];
            }
            var arr = []
            var ref = db.ref("users/"+app.loggedIn.id+"/messages");
            ref.once('value',function(snap){
                for (message in snap.val()){
                    arr.push(snap.val()[message]);
                }
            });
            arr.sort(function(a,b){
                return b.time-a.time;
            });
            return arr;
        }
        

        
    },
    
    
    methods: {
        
        signIn(){ // if everything is valid, signs in to the account
            var go = 0;
            var oy = 0;
            var roll = 0;
            var nots = 0;
            for (var child in this.users){
                
                if (this.users[child].name === app.oldusername){
                    oy = oy + 1;
                    if (this.users[child].password !== app.oldpassword){
                        alert("incorrect password");
                        return 0
                    }
                    app.loggedIn.index = child;
                    nots = this.users[child].notifications;
                    go = this.users[child].photo.url;
                    roll = this.users[child].role;
                    app.loggedIn.id = this.users[child].id;
                    break;
                    
                }


            }

                
            
            if (oy !== 1){
                alert("user not found");
                return 0;
            }
            app.notifications = [];
            db.ref('users/'+app.loggedIn.id+'/messages').once('value',function(snap){
                for (message in snap.val()){
                    app.notifications.push(snap.val()[message]);
                   
                }
                
            });
            
            app.loggedIn.name = app.oldusername;
            app.loggedIn.photo = go;
            app.role = roll;
            app.logged = true;
            app.loggedIn.notifications = nots;
            db.ref("hist/"+Date.now()).set({
                time: presenttime(),
                mes: "sign in by "+app.loggedIn.name
            });
        },
        
        signOut(){
            app.loggedIn.name = "nobody";
            app.loggedIn.id = -1;
            app.logged = false;
            app.role = "guest";
            app.screen = "main";
            app.notifications = [];
        },
        
        signUp(){  // if everything is valid, makes a new account
            var go = 0;
            var id = app.newusername;
            var oy = 0;
            if (app.newpassword !== app.confirmpassword){
                alert("passwords do not match");
                return 0;
            }
            if (app.newusername === "" || app.newpassword === ""){
                alert("please enter a valid username and password");
                return 0;
            }
            for (var child in this.users){
                if (this.users[child].name === app.newusername){
                    alert("username already taken");
                    oy = 1;
                    return 0;
                }
                go = child;
            }
            db.ref("users/"+ id).set({
                        name: app.newusername,
                        password: app.newpassword,
                        photo: "./data/pic.png",
                        id: id,
                        role: "user",
                        notifications: 0
                    
                    });
            app.logged = true;
            app.loggedIn.name = app.newusername;
            app.loggedIn.id = id;
            app.loggedIn.photo = "./data/pic.png";
            app.role = "user";
            db.ref("hist/"+Date.now()).set({
                time: presenttime(),
                mes: "new account: "+app.loggedIn.name
            });
            
        },
        createProject(){ // c
            if (!app.logged){
                alert("Please log in to create a project.");
                return 0;
            }
            if (app.newProjName != "" && app.newK > 0){
                var id = app.newProjName+app.loggedIn.name+Date.now();
                var now = presenttime();
                db.ref("projects/"+id).set({
                    id: id,
                    name: app.newProjName,
                    created: now,
                    kval: app.newK,
                    edit: app.newEditPrivs,
                    view: app.newPrivacy,     
                    owner: app.loggedIn.name
                });
                var arr = [];
                    arr.push({
                           name: app.loggedIn.name,
                            isOwner: true,
                            role: "admin"

                        });

                db.ref("projects/"+id+"/users/").set({
                    arr
                });
                if (app.newOwnerIsAgent == "Yes"){
                    var arr = [];
                    arr.push({
                            id: 0,
                           name: app.loggedIn.name,
                            elo: 1000,
                            isUser: true,
                            user: app.loggedIn.name

                        });
                    db.ref("projects/"+id+"/agents").set({
                        array: arr
                    });
                }
                app.currentProject = 
                    {
                        id: id,
                        name: app.newProjName,
                        created: now,
                        kval: app.newK,
                        edit: app.newEditPrivs,
                        view: app.newPrivacy,     
                        owner: app.loggedIn.name
                    };

            }
            db.ref("hist/"+Date.now()).set({
                time: presenttime(),
                mes: "new project: "+ app.loggedIn.name +"by"+app.loggedIn.name
            });
            
            this.screen = "main";
            
        },
        enterProject(project){
            var ref = db.ref("projects/"+project);
            app.screen = 'project';
            ref.once('value', function(snap){
                val = snap.val();
                app.currentProject = 
                    {
                        id: val.id,
                        name: val.name,
                        created: val.created,
                        kval: val.kval,
                        edit: val.edit,
                        view: val.view,     
                        owner: val.owner
                    };
                app.editProjName = val.name;
                app.editK= val.kval;
                app.editPrivacy=  val.view;
                app.editEditPrivs = val.edit;
                app.agentList = [];
                if(val.agents !== undefined){
                    app.agentList = val.agents.array;
                };
                
                app.userList = val.users.arr;
                
            });

        },
        
        addUser(){
            var oy = 0;
            for (var child in this.users){
                
                if (this.users[child].name === app.newUserName){
                    oy = oy + 1;

                }
            }
            if (oy === 0){
                alert ("user not found");
                return 0;
            }
            app.ff = "false";
            if (app.newUserName === ""){
                alert ("please enter a name");
                return 0;
            }
            app.userList.push({
                           name: app.newUserName,
                           role: "user",
                            isOwner: false
//                            Add Invited
                        });
            var ll = app.userList.length -1
            var ref = db.ref("projects/"+app.currentProject.id+"/users/arr/"+ll);
            ref.set({
                           name: app.newUserName,
                           role: "user",
                            isOwner: false
                            // Add Invited

                        });
            app.ff = "true";
        },
        addAgent(){
            var user = "";
            var tisUser = false;
            if (app.newAgentUser !== "Not a User"){
                isUser = true;
                user = app.newAgentUser;
            }
            if (app.newAgent === ""){
                alert ("please enter a name");
                return 0;
            }
            var ll = app.agentList.length
            app.agentList.push({
                           name: app.newAgent,
                            elo: 1000,
                            isUser: tisUser,
                            user: user,
                            id:ll

                        });
            var ll = app.agentList.length -1
            var ref = db.ref("projects/"+app.currentProject.id+"/agents/array/"+ll);
            ref.set({
                           name: app.newAgent,
                            elo: 1000,
                            isUser: tisUser,
                            user: user,
                            id: ll
                            

                        });
            app.newAgentUser = '';
        },
        changeElo(id){
            app.ff = false;
            var ref = db.ref("projects/"+app.currentProject.id+"/agents/array/"+id);
            ref.once('value',function(snap){
                var ll = snap.val()
                ref.set({
                    elo: parseInt(app.oldAgentElo),
                   name: ll.name,
                    isUser: ll.isUser,
                    user: ll.user,
                    id: ll.id
                });
                app.ff = true;
            });
            app.agentList[id].elo = app.oldAgentElo;

        },
        resolveOutcome(){
            if (app.outcome === ""){
                alert("please enter the outcome of the game");
                return 0;
            }
            var newA1 = 0;
            var newA2 = 0;
            var a1Change = 0;
            var a2Change = 0;
            
            if (app.outcome === "a1"){
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,1, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,0, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
                
            }
            else if (app.outcome === "a2"){
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,0, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,1, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
            }
            else{
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,0.5, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,0.5, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
            }
            a1Ref = db.ref("projects/"+app.currentProject.id+"/agents/array/"+app.gameAgent1.id);
            a2Ref = db.ref("projects/"+app.currentProject.id+"/agents/array/"+app.gameAgent2.id);

            a1Ref.update({
                elo: newA1
            });
            a2Ref.update({
                elo: newA2
            });
            var id = app.currentProject.id+app.gameAgent1.name+app.gameAgent2.name+Date.now();
            var gamesRef = db.ref("games/"+id);
            gamesRef.set({
                a1: app.gameAgent1,
                a2: app.gameAgent2,
                newa1: newA1,
                newa2: newA2,
                a1Change: a1Change,
                a2Change: a2Change,
                time: Date.now(),
                id: id,
                project: app.currentProject,
                result: app.outcome
                
            });
            var ref = db.ref("projects/"+app.currentProject.id);
            
            ref.once('value', function(snap){
                val = snap.val();
                app.agentList = val.agents.array;
            
            });
            app.gameAgent1 = "Select an Agent";
            app.gameAgent2 = "Select an Agent";
            
        },
        sendOutcome(){
            if (app.outcome === ""){
                alert("please enter the outcome of the game");
                return 0;
            }
            var newA1 = 0;
            var newA2 = 0;
            var a1Change = 0;
            var a2Change = 0;
            
            if (app.outcome === "a1"){
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,1, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,0, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
                
            }
            else if (app.outcome === "a2"){
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,0, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,1, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
            }
            else{
                newA1 = Math.round(calculateNewElo(app.gameAgent1.elo,app.gameAgent2.elo,0.5, app.currentProject.kval));
                a1Change = newA1-app.gameAgent1.elo;
                newA2 = Math.round(calculateNewElo(app.gameAgent2.elo,app.gameAgent1.elo,0.5, app.currentProject.kval));
                a2Change = newA2-app.gameAgent2.elo;
            }
            var id = app.currentProject.id+app.gameAgent1.name+app.gameAgent2.name+Date.now();
            a1String = ("projects/"+app.currentProject.id+"/agents/array/"+app.gameAgent1.id);
            a2String = ("projects/"+app.currentProject.id+"/agents/array/"+app.gameAgent2.id);
            var message = ("Accept results of match vs. "+app.gameAgent1.name+" ("+app.loggedIn.name+")?");
            
            var recipientRef = db.ref("users/"+app.gameAgent2.user+"/messages/"+id);
            var notesRef = db.ref("users/"+app.gameAgent2.user+"/notifications");
            
            notesRef.once('value',function(snap){
                
                notesRef.set(snap.val() + 1);
            });
            
           recipientRef.set({
                   message: message,
                   a1string:a1String,
                   a2string:a2String,
                a1: app.gameAgent1,
                a2: app.gameAgent2,
                newa1: newA1,
                newa2: newA2,
                a1Change: a1Change,
                a2Change: a2Change,
                time: Date.now(),
                id: id,
                project: app.currentProject,
                result: app.outcome
               
           });

            app.gameAgent2 = "Select an Agent";
        },
        allowView(project){
            if (RussianHackerMode){
                return true;
            }
            if (project.view === "public"){
                return true;
            }
            if (app.role === "guest"){
                return false;
            }
            if (app.role === "admin"){
                return true;
            }
            if (project.owner === app.loggedIn.name){
                return true;
            }
            var usersRef = db.ref("projects/"+ project.id+"/users/arr");
            var check = 0;
            usersRef.once('value', function(snap){
                check = false;
                for (soul in snap.val()){
                    if (snap.val()[soul].name === app.loggedIn.name){
                        check = true;
                        break;
                    }
                }
                
            });
            return check;
        },
        allowEdit(){
            if (RussianHackerMode){
                return true;
            }
            if (app.currentProject.edit === "public"){
                return true;
            }
            if (app.role === "guest"){
                return false;
            }
            if (app.role === "admin"){
                return true;
            }
            if (app.currentProject.edit === "owner only"){
                if (app.currentProject.owner === app.loggedIn.name){
                    return true;
                }
                return false;
            }
            return true;
        },
       
        allowGame(){
            if (RussianHackerMode){
                return true;
            }
            if (app.currentProject.edit === "public"){
                return true;
            }
            if (app.role === "guest"){
                return false;
            }
            if (app.role === "admin"){
                return true;
            }
            if (app.currentProject.edit === "owner only"){
                if (app.currentProject.owner === app.loggedIn.name){
                    return true;
                }
                
                return false;
            }
            return false;
                
        
        },
        allowParticipate(){
            var agentsRef = db.ref("projects/"+ app.currentProject.id+"/agents/array");
            var check = 0;
            agentsRef.once('value', function(snap){
                check = false;
                for (soul in snap.val()){
                    if (snap.val()[soul].user === app.loggedIn.name){
                        check = true;
                        break;
                    }
                }
                
            });
            
            return check;
            
        },
        editProject(){
            
            db.ref("projects/"+app.currentProject.id).update({
                name: app.editProjName,
                kval: app.editK,
                edit: app.editEditPrivs,
                view: app.editPrivacy,   
                
            });
            app.enterProject(app.currentProject.id);
        },
        rejectResults(message){
            db.ref('users/'+app.loggedIn.id+'/messages/'+message.id).set(null);
            
            var notesRef = db.ref("users/"+app.loggedIn.id+"/notifications");
            
            notesRef.once('value',function(snap){
                app.loggedIn.notifications =  app.loggedIn.notifications - 1;
                notesRef.set(snap.val() - 1);
                
            });
            for(var noti in app.notifications){
  
                if (app.notifications[noti].id === message.id){
                    app.notifications.pop(noti);
                    break;
                }
            }
        },
        acceptResults(message){

            for(var noti in app.notifications){
  
                if (app.notifications[noti].id === message.id){
                    app.notifications.pop(noti);
                    break;
                }
            }
            
            
            var a1Ref = db.ref("projects/"+message.project.id+"/agents/array/"+message.a1.id);
            var a2Ref = db.ref("projects/"+message.project.id+"/agents/array/"+message.a2.id);
            
            var check = 0;
            a2Ref.once('value',function(snap){
                if (snap.val() === undefined){
                    check = 1;
                    return 0;
                }
                a2Ref.update({
                    elo:snap.val().elo+message.a2Change
                });
            });
            if (check === 1){
                return 0;
            }
            var notesRef = db.ref("users/"+app.loggedIn.id+"/notifications");
            db.ref('users/'+app.loggedIn.id+'/messages/'+message.id).set(null);
            notesRef.once('value',function(snap){
                app.loggedIn.notifications =  app.loggedIn.notifications - 1;
                notesRef.set(snap.val() - 1);
            });
            db.ref('games/'+message.id).set({
                a1: message.a1,
                a2: message.a2,
                newa1: message.newa1,
                newa2: message.newa2,
                a1Change: message.a1Change,
                a2Change: message.a2Change,
                time: message.time,
                id: message.id,
                project: message.project,
                result: message.result
                
            });

                       
        }

        
    }
});


// mount
app.$mount('#app');
