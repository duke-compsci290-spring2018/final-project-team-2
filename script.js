/*
 *  a 
 *
 * @author Ryan Ferner
 */

// Initialize Firebase
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
    return (yy+"-"+mm+"-"+dd);
}



var db = firebase.initializeApp(config).database();
// global reference to remote data
var storageRef = firebase.storage().ref();
// global reference to remote data
var projectsRef = db.ref('projects');
var usersRef = db.ref('users');
var gamesRef = db.ref('games');
var agentsRef = db.ref('agents');
// connect Firebase to Vue
Vue.use(VueFire);




var app = new Vue({
    // not entirely dissimilar

    
    data: {  
        screen: "main",
        role: "guest",
        logged: false,
        
        
        loggedIn:{
                name: "Anonymous",
                photo: "./data/pic.png",
                id: -1
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
        outcome: ""
        
        
        
    },
    firebase: {
        projects: projectsRef,
        users: usersRef,
        games: gamesRef,
        agents: agentsRef
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
        }
        

        
    },
    
    
    methods: {
        
        signIn(){ // if everything is valid, signs in to the account
            var go = 0;
            var oy = 0;
            var roll = 0;
            for (var child in this.users){
                
                if (this.users[child].name === app.oldusername){
                    oy = oy + 1;
                    if (this.users[child].password !== app.oldpassword){
                        alert("incorrect password");
                        return 0
                    }
                    app.loggedIn.index = child;
   
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
            app.loggedIn.name = app.oldusername;
            app.loggedIn.photo = go;
            app.role = roll;
            app.logged = true;
        },
        
        signOut(){
            app.loggedIn.name = "nobody";
            app.loggedIn.id = -1;
            app.logged = false;
            app.role = "guest";
            app.screen = "main";
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
                        role: "user"
                    
                    });
            app.logged = true;
            app.loggedIn.name = app.newusername;
            app.loggedIn.id = id;
            app.loggedIn.photo = "./data/pic.png";
            app.loggedIn.role = "user";
            
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
                
                app.agentList = val.agents.array;
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
                            isOwner: "false"
//                            Add Invited
                        });
            var ll = app.userList.length -1
            var ref = db.ref("projects/"+app.currentProject.id+"/users/arr/"+ll);
            ref.set({
                           name: app.newUserName,
                           role: "user",
                            isOwner: "false"
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
            app.agentList.push({
                           name: app.newAgent,
                            elo: 1000,
                            isUser: tisUser,
                            user: user

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
                id: id
            });
            var ref = db.ref("projects/"+app.currentProject.id);
            
            ref.once('value', function(snap){
                val = snap.val();
                app.agentList = val.agents.array;
            
            });
            app.gameAgent1 = "Select an Agent";
            app.gameAgent2 = "Select an Agent";
            
        }
        
        
    }
});


// mount
app.$mount('#app');
