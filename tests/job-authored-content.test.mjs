import test from "node:test";
import assert from "node:assert/strict";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { AUTHORED_JOB_CONTENT, AUTHORED_FLAGSHIP_CHOICES } from "../src/data/job-authored-content.js";
import { JOB_STORYLINES } from "../src/data/job-storylines.js";
import { jobProductionFrames } from "../src/data/job-production-scenes.js";

test("75份通告各幕與兩條試鏡承接都不共用輪替正文",()=>{
 assert.equal(Object.keys(AUTHORED_JOB_CONTENT).length,75);
 const content=JOB_CATALOG.map(job=>AUTHORED_JOB_CONTENT[job.id]);
 for(const key of ["arrival","passed","failed"])
  assert.equal(new Set(content.map(item=>item.audition[key])).size,75,key);
 for(const stage of [0,1,2,3])
  assert.equal(new Set(content.map(item=>item.production[stage])).size,75,`stage ${stage}`);
 for(const key of ["steady","bold"])
  assert.equal(new Set(content.map(item=>item.completion[key])).size,75,key);
 for(const key of ["scope","breach","legacy"])
  assert.equal(new Set(content.map(item=>item[key])).size,75,key);
});

test("所有既有工作長度均依序呈現四幕一次，不漏短通告或重播長通告",()=>{
 for(const job of JOB_CATALOG){
  const stages=[];
  for(let done=1;done<=job.sessions;done++){
   const frames=jobProductionFrames(job,{completedSessions:done},{completed:done===job.sessions});
   stages.push(...frames.map(frame=>frame.stage));
   if(done<job.sessions)assert.ok(frames.every(frame=>frame.stage!==3),job.id);
  }
  assert.deepEqual(stages,[0,1,2,3],job.id);
 }
});

test("15份旗艦維持既有分歧ID，45個選項有各自情境與後果",()=>{
 assert.equal(Object.keys(AUTHORED_FLAGSHIP_CHOICES).length,15);
 const choices=[];
 for(const[id,set]of Object.entries(AUTHORED_FLAGSHIP_CHOICES)){
  assert.equal(JOB_STORYLINES[id].depth,"A",id);
  assert.deepEqual(Object.keys(set),["protect","breakthrough","signature"],id);
  for(const choice of Object.values(set)){
   assert.ok(choice.label.length>5,id);assert.ok(choice.outcome.length>20,id);
   choices.push(choice);
  }
 }
 assert.equal(new Set(choices.map(choice=>choice.label)).size,45);
 assert.equal(new Set(choices.map(choice=>choice.outcome)).size,45);
});
