/* Barmaan Social Media - frontend only */
const TZ=3.5*60*60*1000;
const KEY="barmaan_social_v1";

const LIMIT={
 Short:5,
 "News Short":5,
 Photo:3,
 Poll:5,
 Text:3
};

const LIFE={
 Short:5,
 "News Short":10,
 Photo:4,
 Poll:2,
 Text:2
};

let db=JSON.parse(localStorage.getItem(KEY)||"null")||{
 posts:[],
 admin:null
};

const $=s=>document.querySelector(s);

function save(){
 localStorage.setItem(KEY,JSON.stringify(db));
}

function now(){
 return Date.now()+TZ;
}

function iso(t){
 return new Date(t-TZ).toISOString()
  .slice(0,16)
  .replace("T"," ")+" GMT+3:30";
}

function clean(){
 const t=now();

 db.posts=db.posts.filter(p=>{
  if(p.status==="blocked"&&p.blockUntil&&t>=p.blockUntil)
   return false;

  return t<p.expires;
 });

 save();
}

function counts(type){
 return db.posts.filter(p=>p.type===type).length;
}

function free(type){
 return counts(type)<LIMIT[type];
}

function render(){
 clean();

 $("#feed").innerHTML=
  db.posts
  .slice()
  .sort((a,b)=>b.created-a.created)
  .map(postHTML)
  .join("")||
  '<p class="muted">No posts yet.</p>';

 renderSteps();
}

function renderSteps(){
 $("#steps").innerHTML=`
 <label>1. Select subject</label>

 <select id="type" onchange="renderForm()">
  <option>Short</option>
  <option>News Short</option>
  <option>Photo</option>
  <option>Poll</option>
  <option>Text</option>
 </select>

 <div id="form"></div>`;

 renderForm();
}

function renderForm(){
 const t=$("#type").value;

 if(!free(t)){
  $("#form").innerHTML=
   '<div class="notice">No empty slot subject isn\'t post try tomorrow in GMT+3:30</div>';
  return;
 }

 let file="";

 if(["Short","News Short","Photo"].includes(t)){
  file=`
  <label>2. Upload your file</label>
  <input id="file"
   type="file"
   accept="${t==="Photo"?"image/*":"video/*"}"
   onchange="checkFile()">`;
 }

 let poll="";

 if(t==="Poll"){
  poll=`
  <label>2. Poll / quiz options (2–5)</label>
  <div id="opts">
   ${opt(0)}${opt(1)}
  </div>

  <button type="button" onclick="addOpt()">+ Add option</button>

  <label>Correct option</label>
  <select id="correct">
   <option value="">No correct answer</option>
   <option value="0">Option 1</option>
   <option value="1">Option 2</option>
  </select>`;
 }

 const caption=`
 <label>${file||poll?"3":"2"}. Write the caption</label>
 <textarea id="caption"
 placeholder="Write the caption..."></textarea>`;

 let pay="";

 if(["Short","News Short","Photo"].includes(t))
  pay=payForm();

 if(t==="Text")
  pay=payText();

 $("#form").innerHTML=
  file+
  poll+
  caption+
  pay+
  `<button class="ok" onclick="post()">Post</button>
   <div id="msg"></div>`;
}

function opt(i){
 return `<input class="opt" placeholder="Option ${i+1}">`;
}

function addOpt(){
 const n=document.querySelectorAll(".opt").length;

 if(n<5){
  $("#opts").insertAdjacentHTML("beforeend",opt(n));
  updateCorrect();
 }else{
  alert("Maximum 5 options.");
 }
}

function updateCorrect(){
 const s=$("#correct");
 if(!s)return;

 s.innerHTML=
 '<option value="">No correct answer</option>'+
 [...document.querySelectorAll(".opt")]
 .map((_,i)=>`<option value="${i}">Option ${i+1}</option>`)
 .join("");
}

function payForm(){
 return `
 <label>4. Select © pay</label>

 <select id="pay">
  <option value="1000">1,000T</option>
  <option value="5000">5,000T</option>
  <option value="10000">10,000T</option>
 </select>

 ${cards()}`;
}

function payText(){
 return `
 <label>3. If someone © select pay</label>

 <select id="pay">
  <option value="50000">50,000T</option>
  <option value="100000">100,000T</option>
 </select>

 ${cards()}`;
}

function cards(){
 return `
 <div class="paybox">
  <input id="card"
   inputmode="numeric"
   placeholder="No. Card: 0000 0000 0000 0000">

  <input id="joined"
   placeholder="Card is joined:">

  <input id="bank"
   placeholder="Bank of card:">
 </div>`;
}

function checkFile(){
 const f=$("#file").files[0];
 const t=$("#type").value;

 if(!f)return;

 if(f.size>25*1024*1024){
  $("#file").value="";
  alert("File is too large for browser storage.");
  return;
 }

 if(t!=="Photo"&&!f.type.startsWith("video/")){
  $("#file").value="";
  alert("Please choose a video.");
  return;
 }

 if(t==="Photo"&&!f.type.startsWith("image/")){
  $("#file").value="";
  alert("Please choose an image.");
 }
}

function post(){
 const t=$("#type").value;

 if(!free(t)){
  renderForm();
  return;
 }

 const p={
  id:crypto.randomUUID(),
  type:t,
  created:now(),
  expires:now()+LIFE[t]*864e5,
  caption:$("#caption")?.value||"",
  status:"active"
 };

 if(["Short","News Short","Photo"].includes(t)){
  const f=$("#file").files[0];

  if(!f){
   msg("Upload a file first.");
   return;
  }

  p.fileName=f.name;
  p.mime=f.type;

  const r=new FileReader();

  r.onload=()=>{
   p.file=r.result;
   finish(p);
  };

  r.readAsDataURL(f);
  return;
 }

 if(t==="Poll"){
  p.options=
   [...document.querySelectorAll(".opt")]
   .map(x=>x.value.trim())
   .filter(Boolean);

  if(p.options.length<2){
   msg("Add at least 2 options.");
   return;
  }

  p.correct=$("#correct").value;
  p.votes={};
 }

 p.pay=+($("#pay")?.value||0);
 p.card=$("#card")?.value||"";
 p.joined=$("#joined")?.value||"";
 p.bank=$("#bank")?.value||"";

 finish(p);
}

function finish(p){
 db.posts.push(p);
 save();
 render();
 alert("Subject posted successfully.");
}

function msg(x){
 const m=$("#msg");
 if(m){
  m.className="notice";
  m.textContent=x;
 }
}

function postHTML(p){
 let body="";

 if(p.type==="Text"){
  body=`<p>${esc(p.caption)}</p>`;
 }

 else if(p.type==="Poll"){
  body=pollHTML(p);
 }

 else if(p.file){
  body=
   p.mime.startsWith("image/")
   ?`<img src="${p.file}">`
   :`<video controls src="${p.file}"></video>`;

  body+=`<p>${esc(p.caption)}</p>`;
 }

 else{
  body=`
   <p class="muted">
    Media: ${esc(p.fileName)}
   </p>
   <p>${esc(p.caption)}</p>`;
 }

 let state="";

 if(p.status==="blocked")
  state="<b>Blocked by admin</b>";

 if(p.status==="deleted")
  state="<b>Deleted</b>";

 let pay="";

 if(p.pay){
  pay=`
  <div class="paybox">
   © pay selected:
   <b>${p.pay.toLocaleString()}T</b><br>
   <small>
    Pay is required by
    ${iso(p.payDue||p.expires)}.
   </small>
  </div>`;
 }

 return `
 <article class="post ${p.status==="blocked"?"blocked":""}">
  <span class="tag">${esc(p.type)}</span>
  ${state}
  <h3>${esc(p.caption||p.type)}</h3>
  ${body}
  ${pay}
  <small>Expires: ${iso(p.expires)}</small>
 </article>`;
}

function pollHTML(p){
 return `
 <p>${esc(p.caption)}</p>

 <div>
 ${p.options.map((o,i)=>
  `<button onclick="vote('${p.id}',${i})">
   ${esc(o)}
  </button>`
 ).join(" ")}
 </div>`;
}

function vote(id,i){
 const p=db.posts.find(x=>x.id===id);
 if(!p)return;

 p.votes[i]=(p.votes[i]||0)+1;

 save();
 render();

 if(p.correct!==""&&String(i)===String(p.correct))
  alert("Correct! ✅");
 else if(p.correct!=="")
  alert("Wrong ❌");
}

function openAdmin(){
 admin.showModal();
 adminLogin();
}

function adminLogin(){
 if(db.admin){
  adminMenu();
  return;
 }

 $("#adminBox").innerHTML=`
 <h2>Admin</h2>

 <p>
 If you're Barmaan enter your mother and dad name
 to open only first name.
 </p>

 <input id="mother" placeholder="Mother name:">
 <input id="dad" placeholder="Dad name:">

 <button onclick="verifyAdmin()">Open</button>

 <div id="amsg"></div>`;
}

function verifyAdmin(){
 const m=$("#mother").value.trim().toLowerCase();
 const d=$("#dad").value.trim().toLowerCase();

 if(m==="farideh"&&d==="amir"){
  db.admin={signed:true};
  save();
  adminMenu();
 }else{
  $("#amsg").textContent="Incorrect name.";
 }
}

function adminMenu(){
 $("#adminBox").innerHTML=`
 <h2>Admin menu</h2>

 <div class="grid">

  <button onclick="giftMenu()">
   Gift pay someone 🎁
  </button>

  <button onclick="blockMenu()">
   Block a subject 🚧
  </button>

  <button onclick="deleteMenu()">
   Delete a subject 🚫
  </button>

  <button onclick="newsMenu()">
   Block or delete the unnews video
  </button>

  <button onclick="signIn()">
   Sign in to the admin menu
  </button>

 </div>

 <div id="apanel"></div>`;
}

function signIn(){
 db.admin.card=
  prompt("Enter number card:")||"";

 db.admin.joined=
  prompt("Your card is joined:")||"";

 db.admin.bank=
  prompt("The card bank:")||"";

 save();

 alert("Signed in.");
}

function listAdmin(action){
 $("#apanel").innerHTML=
  "<h3>Select subject</h3>"+
  (
   db.posts.map(p=>
    `<button class="slot"
     onclick="${action}('${p.id}')">
     ${esc(p.type)} —
     ${esc(p.caption||p.id)}
    </button>`
   ).join("<br>")||
   "<p>No subjects.</p>"
  );
}

function giftMenu(){
 if(!db.admin.card){
  alert("first sign in");
  return;
 }

 listAdmin("gift");
}

function gift(id){
 const p=db.posts.find(x=>x.id===id);
 if(!p)return;

 p.gifted=true;
 save();

 alert("Gifted");
}

function blockMenu(){
 listAdmin("blockAsk");
}

function blockAsk(id){
 if(!confirm(
  "Are you sure want to block and wanna pay a random T/تومان?"
 ))return;

 const p=db.posts.find(x=>x.id===id);

 p.status="blocked";
 p.blockUntil=now()+864e5;
 p.payDue=p.blockUntil;

 save();
 render();

 alert("Blocked for 1 day.");
}

function deleteMenu(){
 listAdmin("del");
}

function del(id){
 const p=db.posts.find(x=>x.id===id);

 if(!p)return;

 p.status="deleted";

 save();
 render();

 alert(
  "Deleted — there's no way to restore it."
 );
}

function newsMenu(){
 listAdmin("newsAsk");
}

function newsAsk(id){
 const p=db.posts.find(x=>x.id===id);

 if(p.type!=="News Short"){
  alert("Choose a News Short.");
  return;
 }

 if(confirm(
  "He have pay 500,000T until 5 days in GMT+3:30?"
  )){
   p.status="blocked";
   p.pay=500000;
   p.payDue=now()+5*864e5;

   save();
   render();

   alert(
    "Owner message: pay 500,000T to unblock."
   );
 }
}

function esc(s){
 return String(s??"").replace(
  /[&<>\"']/g,
  c=>({
   "&":"&amp;",
   "<":"&lt;",
   ">":"&gt;",
   "\"":"&quot;",
   "'":"&#39;"
  }[c])
 );
}

setInterval(render,60000);
render();
