"use strict";
const FEED=document.getElementById("feed");
const STORAGE_PREFIX="barmaan_poll_";
document.addEventListener("DOMContentLoaded",loadPosts);
async function loadPosts(){
try{
const response=await fetch("posts.json",{cache:"no-store"});
if(!response.ok)throw new Error("posts.json could not be loaded.");
const data=await response.json();
renderFeed(data);
}catch(error){showError(error.message);}
}
function renderFeed(data){
FEED.innerHTML="";
if(!data||!Array.isArray(data.posts)||data.posts.length===0){showEmpty();return;}
const posts=data.posts.filter(item=>item&&typeof item==="object");
if(posts.length===0){showEmpty();return;}
posts.forEach(item=>FEED.appendChild(createCard(item)));
}
function showEmpty(){
FEED.innerHTML='<section class="empty"><div class="empty-title">Nothing released yet</div><div class="empty-text">There is currently no content in posts.json.</div></section>';
}
function showError(message){
FEED.innerHTML='<section class="error"><strong>Unable to load content.</strong><br>'+escapeHtml(message)+'</section>';
}
function createCard(item){
const card=document.createElement("article");
card.className="card";
const head=document.createElement("div");
head.className="card-head";
const subject=document.createElement("div");
subject.className="subject";
subject.textContent=getSubject(item);
const type=document.createElement("span");
type.className="type";
type.textContent=normalizeType(item.type);
head.append(subject,type);
const content=document.createElement("div");
content.className="content";
renderType(item,content);
card.append(head,content);
return card;
}
function getSubject(item){
if(typeof item.subject==="string"&&item.subject.trim())return item.subject.trim();
if(item.subject&&typeof item.subject.display==="string")return item.subject.display;
return "Untitled";
}
function normalizeType(type){
const value=String(type||"Text").trim();
const map={"Short":"Shorts","Shorts":"Shorts","Short news":"Short news","Short News":"Short news","Poll":"Poll","Photo":"Photo","Text":"Text"};
return map[value]||"Text";
}
function renderType(item,target){
const type=normalizeType(item.type);
if(type==="Shorts")return renderShort(item,target);
if(type==="Short news")return renderShortNews(item,target);
if(type==="Poll")return renderPoll(item,target);
if(type==="Photo")return renderPhoto(item,target);
renderText(item,target);
}
function addCaption(item,target){
if(!item.caption)return;
const caption=document.createElement("p");
caption.className="caption";
caption.textContent=String(item.caption);
target.appendChild(caption);
}
function renderShort(item,target){
addCaption(item,target);
if(!item.media)return;
const video=document.createElement("video");
video.className="media";
video.controls=true;
video.playsInline=true;
video.preload="metadata";
video.src=String(item.media);
target.appendChild(video);
}
function renderShortNews(item,target){
const box=document.createElement("div");
box.className="news";
box.textContent=String(item.caption||item.text||"Nothing released yet");
target.appendChild(box);
}
function renderPhoto(item,target){
addCaption(item,target);
if(!item.media)return;
const image=document.createElement("img");
image.className="media photo";
image.alt=getSubject(item);
image.loading="lazy";
image.src=String(item.media);
target.appendChild(image);
}
function renderText(item,target){
const box=document.createElement("div");
box.className="text-box";
box.textContent=String(item.text||item.caption||"Nothing released yet");
target.appendChild(box);
}
function renderPoll(item,target){
const question=document.createElement("div");
question.className="poll-question";
question.textContent=String(item.question||"Choose one answer:");
target.appendChild(question);
const options=Array.isArray(item.options)?item.options:[];
if(options.length===0){
const missing=document.createElement("div");
missing.className="poll-result";
missing.textContent="No poll options available.";
target.appendChild(missing);
return;
}
const wrapper=document.createElement("div");
wrapper.className="poll-options";
const pollId=String(item.id||getSubject(item));
const saved=getSavedAnswer(pollId);
const total=getTotalVotes(options);
options.forEach((option,index)=>{
wrapper.appendChild(createPollOption(item,option,index,pollId,saved,total));
});
target.appendChild(wrapper);
const result=document.createElement("div");
result.className="poll-result";
if(saved!==null)showPollState(item,wrapper,result,saved);
target.appendChild(result);
}
function createPollOption(item,option,index,pollId,saved,total){
const button=document.createElement("button");
button.type="button";
button.className="poll-option";
const bar=document.createElement("span");
bar.className="bar";
const inside=document.createElement("span");
inside.className="option-content";
const label=document.createElement("span");
label.textContent=getOptionLabel(option);
const percentage=document.createElement("span");
percentage.className="percentage";
percentage.textContent=saved===null?"":getPercent(getVotes(option),total)+"%";
inside.append(label,percentage);
button.append(bar,inside);
if(saved!==null){
button.disabled=true;
bar.style.width=getPercent(getVotes(option),total)+"%";
if(isCorrect(item,index))button.classList.add("correct");
if(index===saved&&!isCorrect(item,index))button.classList.add("wrong");
}
button.addEventListener("click",()=>handlePollAnswer(item,index,pollId,button));
return button;
}
function handlePollAnswer(item,index,pollId,clicked){
if(getSavedAnswer(pollId)!==null)return;
saveAnswer(pollId,index);
const wrapper=clicked.parentElement;
const total=getTotalVotes(item.options);
const result=wrapper.nextElementSibling;
wrapper.querySelectorAll(".poll-option").forEach((button,i)=>{
button.disabled=true;
const option=item.options[i];
const percent=getPercent(getVotes(option),total);
button.querySelector(".bar").style.width=percent+"%";
button.querySelector(".percentage").textContent=percent+"%";
if(isCorrect(item,i))button.classList.add("correct");
if(i===index&&!isCorrect(item,i))button.classList.add("wrong");
});
showPollState(item,wrapper,result,index);
}
function showPollState(item,wrapper,result,selected){
result.innerHTML="";
const state=document.createElement("div");
state.className="answer";
state.textContent=isCorrect(item,selected)?"Correct!":"Not correct.";
const details=document.createElement("div");
const correct=findCorrectIndex(item);
details.textContent=correct>=0?"Correct answer: "+getOptionLabel(item.options[correct]):"No correct answer was configured.";
result.append(state,details);
}
function findCorrectIndex(item){
if(!Array.isArray(item.options))return -1;
if(typeof item.correctAnswer==="number"){
return item.correctAnswer>=0&&item.correctAnswer<item.options.length?item.correctAnswer:-1;
}
if(typeof item.correctAnswer==="string"){
return item.options.findIndex(option=>getOptionLabel(option)===item.correctAnswer);
}
return -1;
}
function isCorrect(item,index){return findCorrectIndex(item)===index;}
function getOptionLabel(option){
if(typeof option==="string")return option;
if(option&&typeof option.text==="string")return option.text;
if(option&&typeof option.label==="string")return option.label;
return "Option";
}
function getVotes(option){
return option&&typeof option.votes==="number"&&Number.isFinite(option.votes)?Math.max(0,option.votes):0;
}
function getTotalVotes(options){
return options.reduce((sum,option)=>sum+getVotes(option),0);
}
function getPercent(votes,total){return total>0?Math.round(votes/total*100):0;}
function getSavedAnswer(id){
try{
const raw=localStorage.getItem(STORAGE_PREFIX+id);
if(raw===null)return null;
const value=Number(raw);
return Number.isInteger(value)?value:null;
}catch(error){return null;}
}
function saveAnswer(id,index){
try{localStorage.setItem(STORAGE_PREFIX+id,String(index));}catch(error){}
}
function escapeHtml(value){
return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function addCardMeta(item,target){
const value=item.createdAt;
if(!value)return;
const time=document.createElement("time");
const date=new Date(value);
if(Number.isNaN(date.getTime()))return;
time.dateTime=value;
time.textContent=formatDate(date);
target.appendChild(time);
}
function formatDate(date){
try{
return date.toLocaleString(undefined,{
year:"numeric",
month:"short",
day:"numeric",
hour:"2-digit",
minute:"2-digit"
});
}catch(error){
return date.toISOString();
}
}
function addPollInfo(item,target,total){
const totalBox=document.createElement("div");
totalBox.className="poll-total";
totalBox.textContent="Total votes: "+total;
target.appendChild(totalBox);
const note=document.createElement("div");
note.className="poll-note";
note.textContent="Choose one option. Your answer is saved on this device.";
target.appendChild(note);
}
function validPost(item){
if(!item||typeof item!=="object")return false;
const allowed=["Shorts","Short news","Poll","Photo","Text"];
return allowed.includes(normalizeType(item.type));
}
function getValidPosts(data){
if(!data||!Array.isArray(data.posts))return [];
return data.posts.filter(validPost);
}
function renderFeedSafe(data){
const posts=getValidPosts(data);
FEED.innerHTML="";
if(posts.length===0){
showEmpty();
return;
}
posts.forEach(item=>{
FEED.appendChild(createCard(item));
});
}
function reloadContent(){
loadPosts();
}
function attachMediaError(element,message){
element.addEventListener("error",()=>{
const error=document.createElement("div");
error.className="media-error";
error.textContent=message;
element.replaceWith(error);
});
}
function isFiniteNumber(value){
return typeof value==="number"&&Number.isFinite(value);
}
function clampVotes(value){
if(!isFiniteNumber(value))return 0;
return Math.max(0,Math.floor(value));
}
function getVotesSafe(option){
if(typeof option==="number")return clampVotes(option);
if(option&&isFiniteNumber(option.votes))return clampVotes(option.votes);
return 0;
}
function getTotalVotesSafe(options){
if(!Array.isArray(options))return 0;
return options.reduce((total,option)=>total+getVotesSafe(option),0);
}
function percentText(votes,total){
return getPercent(votes,total)+"%";
}
function optionHasText(option){
return getOptionLabel(option)!=="Option";
}
function pollHasCorrectAnswer(item){
return findCorrectIndex(item)>=0;
}
function answerMessage(item,index){
if(!pollHasCorrectAnswer(item))return "No correct answer was configured.";
return isCorrect(item,index)?"Correct!":"Not correct.";
}
function correctAnswerText(item){
const index=findCorrectIndex(item);
if(index<0)return "No correct answer was configured.";
return "Correct answer: "+getOptionLabel(item.options[index]);
}
function updatePercentage(button,option,total){
const percentage=getPercent(getVotesSafe(option),total);
const bar=button.querySelector(".bar");
const text=button.querySelector(".percentage");
if(bar)bar.style.width=percentage+"%";
if(text)text.textContent=percentage+"%";
}
function disablePollButtons(wrapper){
wrapper.querySelectorAll(".poll-option").forEach(button=>{
button.disabled=true;
});
}
function markPollButtons(item,wrapper,selected){
wrapper.querySelectorAll(".poll-option").forEach((button,index)=>{
if(isCorrect(item,index))button.classList.add("correct");
if(index===selected&&!isCorrect(item,index))button.classList.add("wrong");
});
}
function getPollStorageKey(item){
return STORAGE_PREFIX+String(item.id||getSubject(item));
}
function hasVoted(item){
return getSavedAnswer(String(item.id||getSubject(item)))!==null;
}
function clearPollAnswer(item){
try{localStorage.removeItem(getPollStorageKey(item));}
catch(error){}
}
function usesSingleChoice(){return true;}
