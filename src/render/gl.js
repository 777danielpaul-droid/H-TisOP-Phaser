// WebGL-Nachbearbeitung (läuft auf der GPU statt Canvas-2D): Bloom, chromatische Aberration, Vignette, Filmkorn in EINEM Durchgang.
// Die Szene wird weiter mit Canvas 2D in ein Offscreen-Canvas gezeichnet; dieses wird als Textur hochgeladen, hier veredelt und in einem
// eigenen Canvas (hinter dem HUD-Canvas) angezeigt. Schlägt irgendetwas fehl (kein WebGL, Kontextverlust), nutzt der Renderer den alten 2D-Pfad (fx.js).
const VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const PRE='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
// Helligkeit² als weicher Schwellwert (wie im 2D-Pfad), 4 Taps beim Verkleinern gegen Flackern
const FS_BRIGHT=PRE+'uniform sampler2D t;uniform vec2 o;varying vec2 v;vec3 s(vec2 u){vec3 c=texture2D(t,u).rgb;return c*c;}void main(){gl_FragColor=vec4((s(v+vec2(-o.x,-o.y))+s(v+vec2(o.x,-o.y))+s(v+vec2(-o.x,o.y))+s(v+o))*.25,1.);}';
const FS_BLUR=PRE+'uniform sampler2D t;uniform vec2 d;varying vec2 v;void main(){vec3 a=vec3(0.);float ws=0.;for(int i=-4;i<=4;i++){float w=exp(-float(i*i)*.15);a+=texture2D(t,v+d*float(i)).rgb*w;ws+=w;}gl_FragColor=vec4(a/ws,1.);}';
const FS_MIX=PRE+'uniform sampler2D s,a,b;uniform float bl,ab,gr,tm,va;uniform vec3 vc;uniform vec2 asp;varying vec2 v;\n'
 +'float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n'
 +'void main(){vec3 c;if(ab>0.){c=vec3(texture2D(s,v-vec2(ab,0.)).r,texture2D(s,v).g,texture2D(s,v+vec2(ab,0.)).b);}else c=texture2D(s,v).rgb;\n'
 +' if(bl>0.)c+=texture2D(b,v).rgb*bl*.9+texture2D(a,v).rgb*bl*.55;\n'
 +' float d=length((v-.5)*asp);c=mix(c,vc,clamp((d-.32)/.66,0.,1.)*va);\n'
 +' if(gr>0.){float n=hs(gl_FragCoord.xy+tm);vec3 ov=mix(2.*c*n,1.-2.*(1.-c)*(1.-n),step(.5,c));c=mix(c,ov,gr);}\n'
 +' gl_FragColor=vec4(c,1.);}';
export class GLPost{
 constructor(){this.ok=false;this.w=0;this.h=0;try{this.init()}catch(e){this.ok=false}}
 init(){const cv=document.createElement('canvas');cv.width=cv.height=2;
  const gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  if(!gl||typeof gl.createShader!=='function')return;
  const prog=(fs,names)=>{const mk=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('shader: '+gl.getShaderInfoLog(s));return s};
   const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,VS));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);
   if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link: '+gl.getProgramInfoLog(p));
   const u={};for(const n of names)u[n]=gl.getUniformLocation(p,n);return{p,u}};
  this.pb=prog(FS_BRIGHT,['t','o']);this.pl=prog(FS_BLUR,['t','d']);this.pm=prog(FS_MIX,['s','a','b','bl','ab','gr','tm','va','vc','asp']);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ok=false});
  this.cv=cv;this.gl=gl;this.ts=this.tex();this.ok=true}
 tex(){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
 fbo(w,h){const gl=this.gl,t=this.tex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return{t,f,w,h}}
 free(o){if(o){this.gl.deleteTexture(o.t);this.gl.deleteFramebuffer(o.f)}}
 size(w,h){const gl=this.gl;this.cv.width=w;this.cv.height=h;this.w=w;this.h=h;this.free(this.A);this.free(this.B1);this.free(this.B2);
  const q=Math.max(2,w>>2),qh=Math.max(2,h>>2),e=Math.max(2,w>>3),eh=Math.max(2,h>>3);
  this.A=this.fbo(q,qh);this.B1=this.fbo(e,eh);this.B2=this.fbo(e,eh);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
 bind(t,unit){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t)}
 pass(P,target){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.f:null);gl.viewport(0,0,target?target.w:this.w,target?target.h:this.h);gl.useProgram(P.p)}
 // src = Szenen-Canvas (2D). o = {bloom, ab (UV-Versatz), vc [r,g,b], va (Vignetten-Stärke), grain, t}
 render(src,o){const gl=this.gl,w=src.width,h=src.height;if(!this.ok)throw new Error('gl off');if(gl.isContextLost&&gl.isContextLost()){this.ok=false;throw new Error('lost')}
  if(w!==this.w||h!==this.h)this.size(w,h);
  this.bind(this.ts,0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  const bl=o.bloom>0?o.bloom:0;
  if(bl>0){
   this.pass(this.pb,this.A);gl.uniform1i(this.pb.u.t,0);gl.uniform2f(this.pb.u.o,1/w,1/h);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);                                  // hell, 1/4
   this.bind(this.A.t,0);this.pass(this.pl,this.B1);gl.uniform1i(this.pl.u.t,0);gl.uniform2f(this.pl.u.d,2/this.A.w,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);    // Weichzeichner waagerecht, 1/8
   this.bind(this.B1.t,0);this.pass(this.pl,this.B2);gl.uniform1i(this.pl.u.t,0);gl.uniform2f(this.pl.u.d,0,1/this.B1.h);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);   // senkrecht
   this.bind(this.ts,0);this.bind(this.A.t,1);this.bind(this.B2.t,2)}
  else{this.bind(this.ts,0);this.bind(this.ts,1);this.bind(this.ts,2)}
  this.pass(this.pm,null);const u=this.pm.u;gl.uniform1i(u.s,0);gl.uniform1i(u.a,1);gl.uniform1i(u.b,2);
  gl.uniform1f(u.bl,bl);gl.uniform1f(u.ab,o.ab||0);gl.uniform1f(u.gr,o.grain||0);gl.uniform1f(u.tm,((o.t||0)*7.13)%997);gl.uniform1f(u.va,o.va||0);
  gl.uniform3f(u.vc,o.vc[0],o.vc[1],o.vc[2]);gl.uniform2f(u.asp,w/h,1);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
}
