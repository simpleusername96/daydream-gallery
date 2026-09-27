// Only confirmed, visible, unpaused renderer time. No disabled-period replay.
export class ActiveTime {
  constructor(analytics) {this.analytics=analytics;this.id=null;this.ms=0;this.started=false;analytics.onChange(()=>{this.ms=0;this.started=false;});}
  select(id) {if(id===this.id)return;this.flush();this.id=id;this.ms=0;this.started=false;}
  advance(delta,running) {
    if(!running || !this.id || !this.analytics.allowed() || !Number.isFinite(delta) || delta<0)return;
    if(!this.started){this.analytics.event('scene_play',{content_id:this.id});this.started=true;}
    this.ms+=delta;
    if(this.ms>=30000)this.flush();
  }
  flush(){if(this.ms>0 && this.id)this.analytics.event('scene_active_time',{content_id:this.id,active_seconds:this.ms/1000,value:this.ms/1000});this.ms=0;}
}
