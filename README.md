# *ELO*
A project in many v-ifs by Ryan Ferner, it has a fairly thorough description on its main page.

*What makes this project useful?*
Skill is a very important concept in zero-sum games, but a very tricky thing to quantify. Elo, although not a perfect measure of a user's skill, is an excellent approximation.  Accordingly, my application is useful because it allows a potentially very large group of users with little knowledge in math or computer science to create, maintain, and update an Elo system.

*special instructions needed to set up, run, access, or use your application (like user passwords you have set up, command line utilities, or external programs that need to be run)*
Also the admin is:
Username: Ryan
password: password
and the backup JSON is named rjf19-elo-export.json in the repository.
I think the instructions in the help menu should be pretty thorough for most things, although whenever you're logged in as an admin, there is a button in the loginbar that lets you view history of login and group creation. Also in the admin menu there is a button that lets you export the entire project in JSON format.  I chose to relegate this to the admin only because the JSON includes what would be sensitive information like login information.

*references for your data that establishes its authenticity*
Since this project is, by its nature, entirely about user-generated data, I don't have a whole lot to tell you here, other than that I used https://en.wikipedia.org/wiki/Timeline_of_the_Napoleonic_era to generate my elo system on the Napoleonic Wars.
I did build in a feature, located in the options menu of a project (of which you are the owner) that allows the user to simulate a large number of games (capped at 99 for sanity's sake). I did some math to ensure that it will roughly follow a realistic distribution of how agents will settle out.


*discuss both the pros and the cons of different framework possibilities you considered and why you made the decision you did (including choosing not to use any framework)*
As far as I could tell, Vue was the best solution, not only because we had done so much work in it, but also because it was described in a few articles I read that Angular and React would not provide anything of more use to me than Vue.  Firebase was another natural choice for the same reason: I needed something both to store persistant data as well as well as facilitate interaction between users, and it seemed like a relatively clean solution.


*feedback*
Haley Fisher, 4/29/18 5:00
It's pretty clear how to go through most of the steps to set up games. The web design is minimal but attractive and the design is also fairly intuitive, not requiring too terribly much explanation. Adding users that aren't agents was slightly confusing to me, but then I did not read the instructions very carefully because I'm an arrogant millenial.

Jason Akers, 4/29/18 6:00
Project setup was quite intuitive, however adding users and starting/adding games could use work.

Daniel Getman, 4/29/18 11:02
The program was easy to use and the instructions were clear. The was however lacking of feedback. I was not sure if my actions went through since no information about the results were posted.



your name and Net ID
Ryan Ferner, rjf19

the date you started the assignment, the date you completed the assignment, and an estimate of the number of hours you worked on it
Sat, Apr 21, Sat, Apr 29, not sure, but somewhere between 40-60 hrs

list of the students with whom you discussed the assignment. Since assignments are to be your own work, you should keep track of anyone with whom you have had a significant conversation about a program. You are welcome to talk with the course staff about the assignment, and to other students about broad ideas and concepts.
Jason Akers

any books, papers, or online resources that you consulted in developing your web site
The d3 documentation

any assets (code, images, or sounds) used within your web site
nope

any bugs or concerns still remaining within your web site
changing the elo directly works properly, but sometimes doesn't properly update on-screen

any extra credit features included in your web site
nope


Also, for reference, the admin is:
Username: Ryan
password: password
and the backup JSON is named rjf19-elo-export.json in the repository