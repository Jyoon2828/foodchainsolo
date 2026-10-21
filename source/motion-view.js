import {dist} from './engine.js';

// The whole simulation runs on this device at 60 steps per second.
export class MotionView{
  constructor(){this.positions=new Map();}
  frame(world,myId,now,dt){
    const result={};
    for(const p of Object.values(world.players)){
      const old=this.positions.get(p.id),moved=old&&old.role===p.role?Math.min(30,dist(old,p)):0;
      const walk=(old?.walk||0)+moved*.065;
      result[p.id]={...p,walk,moving:moved/Math.max(.001,dt),jump:p.role===0?p.effect:0};
      this.positions.set(p.id,{x:p.x,y:p.y,role:p.role,walk});
    }
    for(const id of this.positions.keys())if(!world.players[id])this.positions.delete(id);
    return result;
  }
}
