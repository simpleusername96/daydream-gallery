/* World model. All samples and feature placements use absolute coordinates.
 * Chunk indices only select a cache window; they never reseed the landscape.
 * This is a bounded-in-memory, continuous coastal-road journey, not scene swaps.
 */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const hex=(s)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const EXTRA_ART="/assets/runtime/bcde71274c91a268036034168690c9b5e191a0e49a2761a31477a5531f815eca.png";
const EXTRA_ASSETS=[{"id":"shrub-coast","rect":[4,164,22,29],"anchor":[0.5,0.92],"kind":"reference-cutout","sourceRect":[665,592,687,621],"referenceSize":[1648,928]},{"id":"orange-flowers","rect":[56,164,18,28],"anchor":[0.5,0.91],"kind":"reference-cutout","sourceRect":[597,641,615,669],"referenceSize":[1648,928]},{"id":"orange-flowers-b","rect":[108,164,19,27],"anchor":[0.5,0.91],"kind":"reference-cutout","sourceRect":[578,653,597,680],"referenceSize":[1648,928]},{"id":"boulder-coast","rect":[160,164,35,30],"anchor":[0.5,0.81],"kind":"reference-cutout","sourceRect":[879,448,914,478],"referenceSize":[1648,928]},{"id":"shore-stone","rect":[212,164,23,23],"anchor":[0.5,0.8],"kind":"reference-cutout","sourceRect":[902,392,925,415],"referenceSize":[1648,928]},{"id":"scrub-dry","rect":[264,164,20,18],"anchor":[0.5,0.94],"kind":"reference-cutout","sourceRect":[165,355,185,373],"referenceSize":[1648,928]},{"id":"cactus-low","rect":[316,164,31,22],"anchor":[0.5,0.94],"kind":"reference-cutout","sourceRect":[79,420,110,442],"referenceSize":[1648,928]},{"id":"rock-pebble","rect":[368,164,24,20],"anchor":[0.5,0.87],"kind":"reference-cutout","sourceRect":[195,372,219,392],"referenceSize":[1648,928]},{"id":"road-post","rect":[420,164,17,20],"anchor":[0.51,0.88],"kind":"reference-cutout","sourceRect":[782,553,799,573],"referenceSize":[1648,928]}];


// BEGIN NATURE EMBED
const NATURE_ART="/assets/runtime/d5d1e7c134c625e28799219221d90ad2ace3b3bf9c632875cba8ae735a824af6.png";
const NATURE_ASSETS=[{"id":"n-broadleaf-1","category":"tree","family":"broadleaf","variant":1,"model":"CommonTree_1","yaw":0,"width":6.8,"clump":false,"anchor":[0.542476414486956,0.9276407506798829],"taxonomy":["vegetation","tree","broadleaf","broadleaf"],"materialSHA256":"d675970ebb57b8ddd1ff93c82c2be8eb8607c831b45f927311454cea6da3df1c","sourceSHA256":"babaf5b74df8f66aab2e75f32c25c606fa1a851bb17b496033810a58975bf729","rect":[0,512,120,106],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-broadleaf-2","category":"tree","family":"broadleaf","variant":2,"model":"CommonTree_2","yaw":24,"width":6.8,"clump":false,"anchor":[0.6060747957326469,0.9391030349376376],"taxonomy":["vegetation","tree","broadleaf","broadleaf"],"materialSHA256":"223432ab7a9f36e7a80722388371baa50e4da0d8bd4e8cf12313ebe209607a00","sourceSHA256":"a594f86ba9b75c353e4d931d3242b51450c8922938eab01744b4c9e9974159e9","rect":[128,512,120,136],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-broadleaf-3","category":"tree","family":"broadleaf","variant":3,"model":"CommonTree_3","yaw":-24,"width":6.8,"clump":false,"anchor":[0.5395790796965299,0.9535584035449184],"taxonomy":["vegetation","tree","broadleaf","broadleaf"],"materialSHA256":"207c6f246a703468c21b50503f03098df68c1c981a89249a20cacef28e00af59","sourceSHA256":"d58d9969f30abf819404d28f8ec506e8f9a52a79c3728cde676b0da04b8e8487","rect":[256,512,84,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-broadleaf-4","category":"tree","family":"broadleaf","variant":4,"model":"CommonTree_4","yaw":0,"width":6.8,"clump":false,"anchor":[0.4844156806650661,0.9461214653856642],"taxonomy":["vegetation","tree","broadleaf","broadleaf"],"materialSHA256":"65805cb1744fb0f4d9414536e5dd34e70b2a998f3eba9c7de4daec75e9abcbd3","sourceSHA256":"64882415a3170fb4cfd8b07e3b72ecbcae3420deee7a2b0c3fdc8cded12260f2","rect":[384,512,91,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-broadleaf-5","category":"tree","family":"broadleaf","variant":5,"model":"CommonTree_5","yaw":24,"width":6.8,"clump":false,"anchor":[0.6108794090336253,0.9394233842737788],"taxonomy":["vegetation","tree","broadleaf","broadleaf"],"materialSHA256":"ec354c72fea2020137eb990af6aee588dcdfd975db06aee70d10a7e0a84a5fd2","sourceSHA256":"92999b816fc0e8941f3bf45c480debd06af226a76b9848081b4396ca1fdcc0d6","rect":[512,512,120,131],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-birch-1","category":"tree","family":"birch","variant":1,"model":"BirchTree_1","yaw":0,"width":4.6,"clump":false,"anchor":[0.2920258452784008,0.9387808990982169],"taxonomy":["vegetation","tree","broadleaf","birch"],"materialSHA256":"41293eabfdfd0abaac8a40b0196742bab7c5e82b03c6356fe9954e3b2402a9c0","sourceSHA256":"b4a09e49ecba2550d2ed04a7c1f1c11a5b04a63cc0e34341a8c820d1f9a41a47","rect":[640,512,93,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-birch-2","category":"tree","family":"birch","variant":2,"model":"BirchTree_2","yaw":24,"width":4.6,"clump":false,"anchor":[0.7004295936892848,0.9528422223387052],"taxonomy":["vegetation","tree","broadleaf","birch"],"materialSHA256":"5bba5ac358af7e00072e2921667f0157ecc1a88dfdfb1eee5845300dd1b613fa","sourceSHA256":"490f569998d2398200de204090313f927da4a45bb32fadc2b5048f5e09eec4fa","rect":[768,512,77,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-birch-3","category":"tree","family":"birch","variant":3,"model":"BirchTree_3","yaw":-24,"width":4.6,"clump":false,"anchor":[0.4847030886447864,0.9576290320589533],"taxonomy":["vegetation","tree","broadleaf","birch"],"materialSHA256":"5fb8b255625b7ac0f52ef310b18322948936b9a6b355fd3c06457ad5cfec207a","sourceSHA256":"a6269dc3b7c3fe86b1a65e9f47bce65086dcab751071bfec8cf29b14bc6b71d8","rect":[896,512,70,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-birch-4","category":"tree","family":"birch","variant":4,"model":"BirchTree_4","yaw":0,"width":4.6,"clump":false,"anchor":[0.4304623551447951,0.9513177366756806],"taxonomy":["vegetation","tree","broadleaf","birch"],"materialSHA256":"ce5cd5be15ac4852566fc8c74fd847d5fa5cd93c19cca55c135531890057cbc9","sourceSHA256":"941ab4be31e1c067e16f140bf5bb85e5569524d7b3e7c8f80eca2b1b7bb39e81","rect":[0,672,111,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-willow-1","category":"tree","family":"willow","variant":1,"model":"Willow_1","yaw":0,"width":7.4,"clump":false,"anchor":[0.30987647433258264,0.9344686569119163],"taxonomy":["vegetation","tree","broadleaf","willow"],"materialSHA256":"7f2c1117d9ec3d8282027aa479fa65fafd2281f8060d477471dda07e8503f8a8","sourceSHA256":"dc68cd018e1691e7bb4943d462012aba6cec370e7e365619f6053a7e04abbdf4","rect":[128,672,109,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-willow-2","category":"tree","family":"willow","variant":2,"model":"Willow_2","yaw":24,"width":7.4,"clump":false,"anchor":[0.16082307168106166,0.9334721938814089],"taxonomy":["vegetation","tree","broadleaf","willow"],"materialSHA256":"0cb90c749839fc56b56aa4788318b00d84fd8e9f43a84f31946449f55494f754","sourceSHA256":"829479d11482fc817c25b75eb447aba65932b614dffcabd545b5636a208cee6e","rect":[256,672,120,124],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-willow-3","category":"tree","family":"willow","variant":3,"model":"Willow_3","yaw":-24,"width":7.4,"clump":false,"anchor":[0.2858204656737902,0.9368383431824406],"taxonomy":["vegetation","tree","broadleaf","willow"],"materialSHA256":"d07e1752c2d39d48c3e0dc9b6ff666de0241a593133e6a61c77ede4d75c325f1","sourceSHA256":"5dd7da7a48621b42f119ba0a56e335ad00338c56486e3040cafa986241699f1c","rect":[384,672,88,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-conifer-1","category":"tree","family":"conifer","variant":1,"model":"PineTree_1","yaw":0,"width":5.1,"clump":false,"anchor":[0.49129801644343496,0.9134394205998149],"taxonomy":["vegetation","tree","conifer"],"materialSHA256":"164014a56a61e2eb107bceef1a187865146a1f2ca3255f7c514ddeb42675b26f","sourceSHA256":"21ff41e3dd50abee4ffb1d1f884aad68f251a81bf4d05fed15d5d7db15201561","rect":[512,672,112,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-conifer-2","category":"tree","family":"conifer","variant":2,"model":"PineTree_2","yaw":24,"width":5.1,"clump":false,"anchor":[0.5103068672990368,0.9336223157009484],"taxonomy":["vegetation","tree","conifer"],"materialSHA256":"4c9bbb3550a03221bde47b3997e94a57331747f2ead5e940c950c85e017b542e","sourceSHA256":"55c3b088118577df7cd363094c49b499058b022a39ad7e8434cb11e40dee0771","rect":[640,672,93,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-conifer-3","category":"tree","family":"conifer","variant":3,"model":"PineTree_3","yaw":-24,"width":5.1,"clump":false,"anchor":[0.526379180864947,0.919801207150244],"taxonomy":["vegetation","tree","conifer"],"materialSHA256":"290dd827332a6aadac4a6b7315de68be48e19f4226d8efa47904171ce1e817e5","sourceSHA256":"905475bb8489b955bef4257630e1954614f378e47df8bc6a5b9b21685542fcde","rect":[768,672,100,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-conifer-4","category":"tree","family":"conifer","variant":4,"model":"PineTree_4","yaw":0,"width":5.1,"clump":false,"anchor":[0.3994852295960042,0.9294509040091639],"taxonomy":["vegetation","tree","conifer"],"materialSHA256":"99d158116cd10b422fe3e805c7d2ad1e909c07ade502bb235d02d4ab364fad0f","sourceSHA256":"e5ce718e37845725990b915bfc0e1c474aaa669b8b15432168d8c386ed202af6","rect":[896,672,70,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-snag-1","category":"tree","family":"snag","variant":1,"model":"CommonTree_Dead_1","yaw":0,"width":3.8,"clump":false,"anchor":[0.5695123437972844,0.942519119239871],"taxonomy":["vegetation","tree","snag"],"materialSHA256":"c74be73bec1aee6d6f9a87e3be9f6ca9449718f6224547eb1824c931db775255","sourceSHA256":"78e3c5e34ca1aa4dd48a644c3c572e6d8734a1fc7f2e41990fd76f6d9f809d37","rect":[0,832,109,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-snag-2","category":"tree","family":"snag","variant":2,"model":"CommonTree_Dead_2","yaw":24,"width":3.8,"clump":false,"anchor":[0.6655567162488077,0.9423039448502408],"taxonomy":["vegetation","tree","snag"],"materialSHA256":"ea7897c44a91f08fa88f657e64812e51374c7235d805418ab5c893983f42a659","sourceSHA256":"1372e35c4ecf48c75a289aa2f2f143c52e3db968c0989cbb78c154cbc56d4553","rect":[128,832,100,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-shrub-1","category":"shrub","family":"shrub","variant":1,"model":"Bush_1","yaw":0,"width":2.1,"clump":false,"anchor":[0.520913492739378,0.7617075686701997],"taxonomy":["vegetation","shrub","shrub"],"materialSHA256":"2a0bf1c9f6ad09cd9b54f7b8c8ef1f31b597b1e142658ddc0c68ad1449b19e0e","sourceSHA256":"0cac6fca9e9a5d899fa1859867bf9cc2dbcc1817b31a0668d8b6faf2b033788b","rect":[256,832,120,118],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-shrub-2","category":"shrub","family":"shrub","variant":2,"model":"Bush_2","yaw":24,"width":2.1,"clump":false,"anchor":[0.505472038652529,0.7574899955281523],"taxonomy":["vegetation","shrub","shrub"],"materialSHA256":"7797af5258d63c7891a9b320185029b45c9e84f79d280539833bf8d184e3f8f7","sourceSHA256":"836828437d2c853099744260b05b8d6b0f837b380ed7473baf11a47b9628bc8b","rect":[384,832,120,122],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-berry-1","category":"shrub","family":"berry","variant":1,"model":"BushBerries_1","yaw":0,"width":2.1,"clump":false,"anchor":[0.49638199336203037,0.7609710487552436],"taxonomy":["vegetation","shrub","berry"],"materialSHA256":"35c656dbada60349e6def68d939a36c036eb02dec4b38f600720d30b5e29f112","sourceSHA256":"0c71ca411304b0a2240df649b470a5d171dd5a821a2b6bf3096e4d5d76496028","rect":[512,832,121,115],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-berry-2","category":"shrub","family":"berry","variant":2,"model":"BushBerries_2","yaw":24,"width":2.1,"clump":false,"anchor":[0.4985538053799761,0.7612220443867344],"taxonomy":["vegetation","shrub","berry"],"materialSHA256":"452b37f3d9f51dafafca622c062c0c4bc9e443f6cfe146172514ebaf59b4ac16","sourceSHA256":"90c93111b6e2f72d277b78595d08fc7402806eff33ec47ae750df86b6f71cc1b","rect":[640,832,121,120],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-cactus-1","category":"shrub","family":"cactus","variant":1,"model":"Cactus_1","yaw":0,"width":2.4,"clump":false,"anchor":[0.47403224511883035,0.9366959466761844],"taxonomy":["vegetation","shrub","cactus"],"materialSHA256":"2aef770aabc7978fda3c9ca339669ca1127b2f225daad44a01f5d2936079f046","sourceSHA256":"1c8697b00d783de8e4da96d21016d245da9cd5575a797b835b70d0e7657e3da2","rect":[768,832,86,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-cactus-2","category":"shrub","family":"cactus","variant":2,"model":"Cactus_2","yaw":24,"width":2.4,"clump":false,"anchor":[0.4776276508167606,0.9509647346425436],"taxonomy":["vegetation","shrub","cactus"],"materialSHA256":"d0f46507c45ceda326b5f702f02df54c5baff21473f436df75389c656b45f2ab","sourceSHA256":"2b9ffdfce6649b5a283485d14eb9f6345c922d99aa49b00826b94b743f4b7385","rect":[896,832,113,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-cactus-3","category":"shrub","family":"cactus","variant":3,"model":"Cactus_3","yaw":-24,"width":2.4,"clump":false,"anchor":[0.5403933882026848,0.948326686135997],"taxonomy":["vegetation","shrub","cactus"],"materialSHA256":"9ebe17444810c8e8196d005e7e084aa85aa618ecac573177375fa5f5514c242a","sourceSHA256":"6d4c343502364b0fc34d78eab75779ba6016159f40dce0c7a4fb08a088d5d3e8","rect":[0,992,60,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-cactus-4","category":"shrub","family":"cactus","variant":4,"model":"Cactus_4","yaw":0,"width":2.4,"clump":false,"anchor":[0.5779006600963137,0.9640977060328166],"taxonomy":["vegetation","shrub","cactus"],"materialSHA256":"5597c7988435127099e871798c92da45308fd845e1736162a35832096ca67aa0","sourceSHA256":"401db30fd1763b639d11839b31669b406a49b5abe62f1457784b97ab5cc506c0","rect":[128,992,88,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-cactus-5","category":"shrub","family":"cactus","variant":5,"model":"Cactus_5","yaw":24,"width":2.4,"clump":false,"anchor":[0.2086773976613092,0.9578882458405847],"taxonomy":["vegetation","shrub","cactus"],"materialSHA256":"a0dd076aadd217577ce0627835974da96e856aa3f50d3ac5883eb9ae91a6e34a","sourceSHA256":"6e1478c90e4b86e3fd9e0d999ac4c8e0017bd1c9f1b855ae5af60531bced1088","rect":[256,992,118,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-rock-1","category":"mineral","family":"rock","variant":1,"model":"Rock_1","yaw":0,"width":2.7,"clump":false,"anchor":[0.45964297643423013,0.8545003131023005],"taxonomy":["terrain","mineral","rock"],"materialSHA256":"d56549cff3285edf892d4e734c41cd383fd18dfde9701209087b2c9f5484325a","sourceSHA256":"34d20ae0234a88b5cf1ceb1e5140b46ece28e6e7d72beb7e2e3a7e1fe8a8708e","rect":[384,992,85,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-rock-2","category":"mineral","family":"rock","variant":2,"model":"Rock_2","yaw":24,"width":2.7,"clump":false,"anchor":[0.4242972505660067,0.8071364866140145],"taxonomy":["terrain","mineral","rock"],"materialSHA256":"6f2c0b28eb53c77a126967e9fad4473e4625530f340da0fa92757dea56bcbf77","sourceSHA256":"e31bc2f25c4e199ef8e890d305316a9fe86b62345879459a25f3e9bfde229a09","rect":[512,992,120,136],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-rock-3","category":"mineral","family":"rock","variant":3,"model":"Rock_3","yaw":-24,"width":2.7,"clump":false,"anchor":[0.5928714591129989,0.7139694398321865],"taxonomy":["terrain","mineral","rock"],"materialSHA256":"cb992da955661b5aa81305b4c0a6d272e543e82e29c096787a5f44b37130e344","sourceSHA256":"e6abbb3e7ae4ebda85209622ffc63cf288a3f78da99f7557bfabe0584497b07a","rect":[640,992,120,126],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-rock-4","category":"mineral","family":"rock","variant":4,"model":"Rock_4","yaw":0,"width":2.7,"clump":false,"anchor":[0.5766130853602255,0.7962988974063353],"taxonomy":["terrain","mineral","rock"],"materialSHA256":"f938665ef6bf88f702205c9b0d7c5f4868876f756f4f12a5a0b64f2adc2f163e","sourceSHA256":"5b0959d73496ac1c1c179522b4c55613b8df4a0aa941cea84bcdc0ec9796be47","rect":[768,992,120,113],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-grass-1","category":"groundcover","family":"grass","variant":1,"model":"Grass_Short","yaw":32,"width":1.6,"clump":true,"anchor":[0.48244338536654846,0.637356172670282],"taxonomy":["vegetation","groundcover","grass"],"materialSHA256":"3a11bbb223ebfd2d4c6514e3f2bc3e7eb2982fc7fe0ac76c2110801e6378333d","sourceSHA256":"fd5733788b4c24a75f01da62d5e599d89ea6ca862c73a983d26a6f4d0c12a157","rect":[896,992,120,105],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-grass-2","category":"groundcover","family":"grass","variant":2,"model":"Grass","yaw":64,"width":1.6,"clump":true,"anchor":[0.5014178473701201,0.7767722324365625],"taxonomy":["vegetation","groundcover","grass"],"materialSHA256":"ce60677aa8473d8544ac95c3daced60d9230a9fb30ba1480a0408192797b12b2","sourceSHA256":"f9dc21d3a1c82380d948e53c3d839ebc9e8de3264c466ed878fb3a368dfee3f9","rect":[0,1152,92,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-grass-3","category":"groundcover","family":"grass","variant":3,"model":"Grass_2","yaw":96,"width":1.6,"clump":true,"anchor":[0.4838822905662728,0.7750599337775455],"taxonomy":["vegetation","groundcover","grass"],"materialSHA256":"e6ddb9be0270d75b59d1914db5946d5bdfa531b14208bbde26a49f49cf9c8e66","sourceSHA256":"6cefdb6f8350596aa1f7d97fcf71a00272a23ab18eb1d8bff0d18a2089fd5399","rect":[128,1152,93,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-dry-grass-1","category":"groundcover","family":"dry-grass","variant":1,"model":"Grass_Short","yaw":32,"width":1.5,"clump":true,"anchor":[0.48244338536654846,0.637356172670282],"taxonomy":["vegetation","groundcover","dry-grass"],"materialSHA256":"3a11bbb223ebfd2d4c6514e3f2bc3e7eb2982fc7fe0ac76c2110801e6378333d","sourceSHA256":"fd5733788b4c24a75f01da62d5e599d89ea6ca862c73a983d26a6f4d0c12a157","rect":[256,1152,120,105],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-dry-grass-2","category":"groundcover","family":"dry-grass","variant":2,"model":"Grass","yaw":64,"width":1.5,"clump":true,"anchor":[0.5014178473701201,0.7767722324365625],"taxonomy":["vegetation","groundcover","dry-grass"],"materialSHA256":"ce60677aa8473d8544ac95c3daced60d9230a9fb30ba1480a0408192797b12b2","sourceSHA256":"f9dc21d3a1c82380d948e53c3d839ebc9e8de3264c466ed878fb3a368dfee3f9","rect":[384,1152,92,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-dry-grass-3","category":"groundcover","family":"dry-grass","variant":3,"model":"Wheat","yaw":96,"width":1.5,"clump":true,"anchor":[0.528628811355668,0.7746055555680436],"taxonomy":["vegetation","groundcover","dry-grass"],"materialSHA256":"2f22d9d6a87ec8861924586320a6ef7fc85ecf44894cf190d7eb89e95b9887c3","sourceSHA256":"4d326157bd26cc327ef5b3112b47e0d2d1133a3623ffdad34397470d6c6bc052","rect":[512,1152,103,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-fern-1","category":"groundcover","family":"fern","variant":1,"model":"Plant_1","yaw":32,"width":1.5,"clump":true,"anchor":[0.5735994063643637,0.5409053000221911],"taxonomy":["vegetation","groundcover","fern"],"materialSHA256":"ff9cf074de75e1bb92a8556f9b3a71056da612da7adcccc6b7da9fefc06833a6","sourceSHA256":"141ea9c5ef72a2cfc5a97fa2fcf3bcf565a9ce11ffce5f3b41afc1e2ccfffb22","rect":[640,1152,120,96],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-fern-2","category":"groundcover","family":"fern","variant":2,"model":"Plant_3","yaw":64,"width":1.5,"clump":true,"anchor":[0.5474651391190297,0.6132169703639508],"taxonomy":["vegetation","groundcover","fern"],"materialSHA256":"3f995007b1d5d4882f5e073937b00a5f618146fca55164c9042b481179151e4e","sourceSHA256":"d7a81a118bc5f07fdad8d21f5d698345b9322e234ebd6ccd9bc7a90c7dd9c89a","rect":[768,1152,120,92],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-fern-3","category":"groundcover","family":"fern","variant":3,"model":"Plant_4","yaw":96,"width":1.5,"clump":true,"anchor":[0.4911305193395463,0.5525298170472887],"taxonomy":["vegetation","groundcover","fern"],"materialSHA256":"8adea2a3fa17083123d061fdbf0e08b768f3fb44866fbfd930ca8eb2e42dd82e","sourceSHA256":"8328260974175fc9d48bf7b8e9306e1ee06290965c8604770a997673c47ac81a","rect":[896,1152,120,79],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-reed-1","category":"groundcover","family":"reed","variant":1,"model":"Plant_2","yaw":32,"width":1.5,"clump":false,"anchor":[0.5193879505976292,0.9645311613131035],"taxonomy":["vegetation","groundcover","reed"],"materialSHA256":"c7f73158ede468c57abfbc43a5c5ac88d448c17c0ef680663123c5fe73efc267","sourceSHA256":"6d09f580b12ab372e5a9bda482d1a0778a06a8fc84aae305456b94636a568e2b","rect":[0,1312,73,148],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-reed-2","category":"groundcover","family":"reed","variant":2,"model":"Plant_5","yaw":64,"width":1.5,"clump":false,"anchor":[0.5,0.7352448551270531],"taxonomy":["vegetation","groundcover","reed"],"materialSHA256":"4d53083072919bd7f629d166b23ab1998230b0c986d885365bbf0f17832bcae6","sourceSHA256":"bb27cb02b0efcd26ea40f6fc41e858bd124da36bf22c3cf2446132ec24ea7211","rect":[128,1312,120,121],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-flower-1","category":"groundcover","family":"flower","variant":1,"model":"Flowers","yaw":32,"width":1.4,"clump":true,"anchor":[0.3783863640119005,0.782814481187024],"taxonomy":["vegetation","groundcover","flower"],"materialSHA256":"79cd76df6a133ccbd76d95a333317ebb662f8d1e0e4f18f1bfda3a7af66f0f8a","sourceSHA256":"8ae37b95704c894392cbb696d5ed2941e098a46c0d12154019a712587c2afb08","rect":[256,1312,120,123],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-deadwood-1","category":"debris","family":"deadwood","variant":1,"model":"WoodLog","yaw":32,"width":2.3,"clump":false,"anchor":[0.4399884518615264,0.7438612250248205],"taxonomy":["vegetation","debris","deadwood"],"materialSHA256":"ef6952f2e552169c9f29ca3459cee47484af7ad48393cad45c8dbfa138327f19","sourceSHA256":"be77b699f46767c13abafa99920931c02495c1aa4749172b508a5c302201acf5","rect":[384,1312,120,50],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-deadwood-2","category":"debris","family":"deadwood","variant":2,"model":"TreeStump","yaw":64,"width":2.3,"clump":false,"anchor":[0.6088994991391722,0.6690406517249747],"taxonomy":["vegetation","debris","deadwood"],"materialSHA256":"186fbe2e30fef6082a1191c6c5af239e68e3f0e06bb1cc9f8c88dbb568c7d7db","sourceSHA256":"8c1a8448a65700c479484477ef36f3882b662857ad2bd400a8e090dc97ad4aab","rect":[512,1312,120,88],"kind":"authored-mesh-bake","source":"Quaternius Ultimate Nature Pack, June 2019 (CC0)"},{"id":"n-flower-2","category":"groundcover","family":"flower","variant":2,"model":"flower_redA","yaw":40,"width":1.5,"clump":true,"provider":"Kenney","anchor":[0.5251964677834685,0.778654737512827],"taxonomy":["vegetation","groundcover","flower"],"materialSHA256":"0c9ad4852b07f6c3b8d1b1d54ed2c19ce48828f259c6fb900c1ced26ba645b53","sourceSHA256":"50bcfeb7b6f8c361bc7e61ce55dfd0cc61ad95073351026476207b0db93c3121","rect":[640,1312,120,138],"kind":"authored-mesh-bake","source":"Kenney Nature Kit (CC0)"},{"id":"n-flower-3","category":"groundcover","family":"flower","variant":3,"model":"flower_yellowB","yaw":60,"width":1.5,"clump":true,"provider":"Kenney","anchor":[0.4815806722192831,0.6148946470192984],"taxonomy":["vegetation","groundcover","flower"],"materialSHA256":"ca4a55c6fd87ce8026d1a8beba9c87fb88b22dff30619f8b80d329a6116cdbc9","sourceSHA256":"3a9e9c5cbc05d33882bb48d1fccd650b88809d13b4884010e81a0099a304a86f","rect":[768,1312,121,84],"kind":"authored-mesh-bake","source":"Kenney Nature Kit (CC0)"},{"id":"n-flower-4","category":"groundcover","family":"flower","variant":4,"model":"flower_purpleC","yaw":80,"width":1.5,"clump":true,"provider":"Kenney","anchor":[0.46233555212698185,0.7089348311577595],"taxonomy":["vegetation","groundcover","flower"],"materialSHA256":"9eb9cff137b2b6fececef78a573f2a5633166a12c24bf321e39f770e825b5424","sourceSHA256":"4ae6b779ffeb358954602c42a4bf7617cff3b5d6687df7c912f98afacc0d1e5e","rect":[896,1312,120,113],"kind":"authored-mesh-bake","source":"Kenney Nature Kit (CC0)"}];
// END NATURE EMBED

const MATERIAL_PALETTES={
 coast:[[145,158,87],[158,169,96],[173,181,109],[184,190,122],[198,200,137]],
 desert:[[221,161,111],[230,172,119],[239,185,130],[244,194,140],[248,202,147]],
 dusk:[[79,65,107],[88,71,115],[100,79,123],[111,87,130],[123,94,138]]
};
// Author a small raster material once, before playback. Colors, not thresholds,
// are mipmapped by WebGL. This is not a full-scene procedural illustration.
function createMaterialTiles(){
 const size=256,seed=731042,grids=[];
 const hash=(x,z,k)=>{let h=(Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(k+1,1442695041)^seed)>>>0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
 for(const [nx,nz]of [[16,16],[32,40],[64,64]]){const a=new Float32Array(nx*nz);for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)a[z*nx+x]=hash(x,z,grids.length);grids.push({nx,nz,a});}
 const sample=(g,x,z)=>{const xx=x*g.nx/size,zz=z*g.nz/size,ix=Math.floor(xx),iz=Math.floor(zz),fx=xx-ix,fz=zz-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),at=(i,j)=>g.a[(j%g.nz)*g.nx+(i%g.nx)];return lerp(lerp(at(ix,iz),at(ix+1,iz),u),lerp(at(ix,iz+1),at(ix+1,iz+1),u),v);};
 const indices=new Uint8Array(size*size);for(let z=0;z<size;z++)for(let x=0;x<size;x++){const n=.56*sample(grids[0],x,z)+.28*sample(grids[1],x,z)+.16*sample(grids[2],x,z);indices[z*size+x]=n<.38?0:n<.47?1:n<.56?2:n<.65?3:4;}
 const tiles={};for(const [theme,palette]of Object.entries(MATERIAL_PALETTES)){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),image=ctx.createImageData(size,size);for(let i=0;i<indices.length;i++){const color=palette[indices[i]],k=i*4;image.data[k]=color[0];image.data[k+1]=color[1];image.data[k+2]=color[2];image.data[k+3]=255;}ctx.putImageData(image,0,0);tiles[theme]=c;}return tiles;
}
const CLOUD_ART="/assets/runtime/a0c6637b88d0dc28d760af5fb73ed7fc78a9371f4ee7558e327abd52e3bb02ba.png";
async function prepareArt(){
 const [image,extra,nature,cloud]=await Promise.all([ATLAS_URL,EXTRA_ART,NATURE_ART,CLOUD_ART].map(async url=>{const image=new Image();image.src=url;await image.decode();return image;}));
 const atlas=document.createElement('canvas');atlas.width=image.width;atlas.height=2048;
 const ctx=atlas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const assets=ASSET_MANIFEST.assets.map(a=>({...a,anchor:[.5,.96]}));
 for(const a of assets){
   const [x,y,w,h]=a.rect,data=ctx.getImageData(x,y,w,h),p=data.data,original=new Uint8ClampedArray(p);
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
     const i=(yy*w+xx)*4;if(!p[i+3])continue;const r=p[i],g=p[i+1],b=p[i+2];
     const edge=xx===0||yy===0||xx===w-1||yy===h-1||!original[i-4+3]||!original[i+4+3]||!original[i-w*4+3]||!original[i+w*4+3];
     if(a.id.startsWith('pine')&&edge&&r>116&&g>123&&b>68)p[i+3]=0;
     if(a.id==='flowers'&&r+g<413&&r<g*1.25)p[i+3]=0;
     if(a.id.startsWith('cottage')&&yy>h*.62&&g>r*1.04&&g>b*1.20)p[i+3]=0;
   }
   if(a.id.startsWith('rock'))a.anchor=[.5,.98];
   if(a.id==='lighthouse')a.anchor=[.5,.93];
   if(a.id.startsWith('cottage'))a.anchor=[.5,.97];
   if(a.id==='sailboat')a.anchor=[.5,.88];
   ctx.putImageData(data,x,y);
 }
 ctx.drawImage(extra,0,160);
 assets.push(...EXTRA_ASSETS);
 ctx.drawImage(nature,0,512);assets.push(...NATURE_ASSETS);
 ctx.drawImage(cloud,0,1792);
 assets.push({id:'cloud-bank',rect:[8,1800,269,84],anchor:[.5,.5],kind:'reference-cutout'},{id:'cloud-wisp',rect:[350,1800,55,16],anchor:[.5,.5],kind:'reference-cutout'});
 const surface=createMaterialTiles();
 return {atlas,surface,manifest:{...ASSET_MANIFEST,assets}};
}

const THEMES={
 coast:{name:'Coastal headlands',label:'COASTLINE',sub:'A little further, nowhere in particular.',ground:['#adb76e','#d1cc82','#81945c'],rock:'#8a8575',shore:'#eee0b3',road:'#a2a08e',line:'#eee2bb',water:'#72b9ab',fog:'#b5d2be',sky:'#b3d3c3',car:'car-coast',time:16.6,landmark:'The lighthouse'},
 desert:{name:'Desert daybreak',label:'CANYON COUNTRY',sub:'Take the long way home.',ground:['#e9ab72','#f3c48b','#cb865f'],rock:'#b67f69',shore:'#deba8f',road:'#93938a',line:'#d9d1b4',water:'#c78b66',fog:'#dfbfb0',sky:'#f0caa5',car:'car-desert',time:7.1,landmark:'Painted canyon'},
 dusk:{name:'Violet dusk',label:'BLUE HOUR',sub:'One more bend before the stars.',ground:['#68608c','#926c98','#45436e'],rock:'#655780',shore:'#9483ad',road:'#796884',line:'#bc91a5',water:'#9985b4',fog:'#b292bd',sky:'#a983b5',car:'car-night',time:19.6,landmark:'The quiet cabin'}
};
// Visual taxonomy is independent of local ecological placement. Species labels
// here describe authored silhouettes, not a scientific flora simulation.
const HABITAT_RULES={
 coast:{trees:{broadleaf:5,birch:1,conifer:3},ground:{grass:6,flower:2,fern:1},clouds:[0,0,1,1,2,4],bands:['roadside-avenue','coastal-grove','flower-meadow','shore-scrub']},
 desert:{trees:{},ground:{'dry-grass':7,flower:.1},clouds:[0,0,0,4,4],bands:['cactus-belt','dry-wash','rock-garden','open-basin']},
 dusk:{trees:{conifer:6,birch:3,broadleaf:1},ground:{fern:5,grass:3,reed:2},clouds:[1,2,3,3,4],bands:['forest-lane','river-grove','fern-hollow','open-glade']}
};

// Scenic reach/parcel data are global authoring units, never cache tiles.
// The retained source meshes supply every tree, flower, rock and cottage.
const SCENIC_COLORS={
 meadow:{soil:'#bac38a',bed:'#c0cc8c',plant:'#aabb73',family:'grass',asset:'n-grass-2'},
 grain:{soil:'#c6bf8b',bed:'#d9cf97',plant:'#bfb57c',family:'dry-grass',asset:'n-dry-grass-3'},
 purple:{soil:'#afb48c',bed:'#aa90b5',plant:'#9176aa',family:'flower',asset:'n-flower-4'},
 yellow:{soil:'#c3c58b',bed:'#d5cf83',plant:'#c0bd6c',family:'flower',asset:'n-flower-3'}
};
const parcelRowU=(f,row,v)=>row*f.spacing+.48*Math.sin(v*.12+f.index+row*.4);
const scenicCache=(cache,key,value,limit)=>{if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,value);return value;};
function scenicFeature(w,id,x,z,key,extra={}){
 const a=NATURE_ASSETS.find(a=>a.id===id);if(!a)return null;
 return {id,x,z,y:w.height(x,z),w:a.width,category:a.category,family:a.family,variant:a.variant,habitat:'cultivated',
  groundcover:a.category==='groundcover',footprint:a.width*(a.category==='tree'?.31:.35),shift:0,key,...extra};
}
function* scenicFeatures(w,cx,cz){
 const out=[],x0=cx*64,z0=cz*64;
 const owned=(x,z)=>Math.floor(x/64)===cx&&Math.floor(z/64)===cz;
 const add=(id,x,z,key,scale=1,extra={})=>{
   if(!owned(x,z)||w.siteExclusion(x,z,1.0))return;
   const h=habitatAt(w,x,z);if(h.y<1.35||h.d<7.5||h.slope>.48)return;
   const f=scenicFeature(w,id,x,z,key,extra);if(!f)return;
   f.w*=scale;f.footprint*=scale;
   if(f.category==='tree'&&(h.d<10.5||h.slope>.28))return;
   if(f.family==='rock'&&h.slope*f.w>1.6)return;
   if(f.family==='willow')f.habitat='riparian';out.push(f);
 };
 // Rows start at the reach's own origin. Adjacent chunks filter the same
 // candidates instead of restarting a row at each chunk boundary.
 for(const n of w.nearbyScenery(z0+32)){
   if(n.kind==='woodland'||n.kind==='flower-fields'){
     const spacing=15+n.rowSpacing,first=Math.ceil((z0-18-(n.z-105))/spacing),last=Math.floor((z0+82-(n.z-105))/spacing);
     for(let k=first;k<=last;k++){
       const z=n.z-105+k*spacing;if(z<n.z-104||z>n.z+106)continue;
       for(const side of [-1,1]){
         yield;const zz=z+side*1.2,t=w.tangent(zz),norm=Math.hypot(1,t),d=13.4;
         const x=w.route(zz)+side*d/norm,rz=zz-side*d*t/norm;
         const id=k%3===0?'n-birch-4':k%3===1?'n-broadleaf-1':'n-broadleaf-5';
         add(id,x,rz,`scenic:avenue:${n.index}:${k}:${side}`,1.02,{scenic:'avenue',reach:n.index});
       }
     }
     if(n.kind==='flower-fields')for(let k=Math.ceil((z0-14-(n.z-110))/2.0);;k++){
       const z=n.z-110+k*2.0;if(z>Math.min(n.z+110,z0+78))break;if(z<n.z-110)continue;
       for(const side of [-1,1])for(let row=0;row<2;row++){
         yield;const zz=z+row*.7+(w.hash(n.index,k+row,747)-.5)*.9,t=w.tangent(zz),norm=Math.hypot(1,t),d=8.6+row*1.3+.28*Math.sin(z*.3+row);
         add('n-flower-3',w.route(zz)+side*d/norm,zz-side*d*t/norm,`scenic:ribbon:${n.index}:${k}:${side}:${row}`,1.24,{scenic:'flower-ribbon',reach:n.index});
       }
     }
   }
   for(const f of w.parcels(n.index)){
     if(f.crop!=='meadow')for(let row=-Math.floor(f.rx/f.spacing);row<=Math.floor(f.rx/f.spacing);row++){
       const u=row*f.spacing;
       // The row is continuous geometry; these are bounded source-plant details.
       const step=f.crop==='grain'?3.4:2.1;
       for(let k=-Math.floor(f.rz/step);k<=Math.floor(f.rz/step);k++){
         yield;const v=k*step+(w.hash(row,k,f.index+733)-.5)*step*.8,point=w.parcelPoint(f,parcelRowU(f,row,v)+(w.hash(row,k,f.index+734)-.5)*1.3,v);
         if(!owned(point[0],point[1])||w.parcelMask(f,...point)<.86)continue;
         const use=w.parcelUse(...point);if(!use||use.parcel.id!==f.id||use.weight<.83)continue;
         const c=SCENIC_COLORS[f.crop];
         add(c.asset,...point,`scenic:crop:${f.id}:${row}:${k}`,f.crop==='grain'?.9:1.30,{scenic:'crop-row',parcel:f.id,row});
       }
     }
     for(const side of [-1,1])for(let k=-5;k<=5;k++){
       yield;const v=k*f.rz*.17+(w.hash(n.index,k,751)-.5)*2,point=w.parcelPoint(f,side*(f.rx+.9+Math.sin(v*.14)),v);
       if(w.hash(n.index,k+side*13,752)<.24)continue;
       add(k%3?'n-grass-2':'n-flower-4',...point,`scenic:margin:${f.id}:${side}:${k}`,1.1,{scenic:'field-margin',parcel:f.id});
     }
     // Interrupted living boundaries, not a fence around every plot.
     for(let k=-3;k<=3;k++){
       yield;const v=k*f.rz*.23,point=w.parcelPoint(f,-f.rx*1.03,v);
       if(k===0||w.hash(n.index,k+9,745)<.25)continue;
       add('n-shrub-1',...point,`scenic:hedge:${f.id}:${k}`,1.45,{scenic:'field-edge',parcel:f.id});
     }
   }
   if(n.kind==='cove')for(const side of [-1,1]){
     const z=n.z+side*35;
     for(let k=0;k<4;k++){
       yield;const rz=z+[-5,0,4,2][k],x=w.coastline(rz)-[7,8.5,6,12][k];
       add(k%2?'n-rock-4':'n-rock-3',x,rz,`scenic:shore:${n.index}:${side}:${k}`,k===1?2.0:1.35,{scenic:'cove-rock',reach:n.index});
     }
   }
 }
 return out;
}

const NATURE_BY_FAMILY={};for(const a of NATURE_ASSETS)(NATURE_BY_FAMILY[a.family]??=[]).push(a);
function habitatAt(w,x,z){
 const y=w.height(x,z),d=Math.abs(x-w.route(z))/Math.hypot(1,w.tangent(z));
 const gx=(w.height(x+1.5,z)-w.height(x-1.5,z))/3,gz=(w.height(x,z+1.5)-w.height(x,z-1.5))/3;
 const slope=Math.hypot(gx,gz),moisture=w.noise(x*.018+4,z*.018-7,411),patch=w.noise(x*.036,z*.032,412);
 const cover=w.woodland(x,z),band=w.bandInfluence(x,z);
 const water=w.theme==='coast'?Math.abs(x-w.coastline(z)):w.theme==='dusk'?Math.abs(x-(w.edge(z)+6+7*w.gradient(z*.014+8,2.9,279))):Infinity;
 let name=w.theme==='desert'?'dry-scrub':cover>.46?'woodland':'meadow';
 if(w.theme==='coast'&&water<10)name='coastal-edge';
 if(w.theme==='dusk'&&y<9&&water<25)name='riparian';
 if(slope>.65)name='rocky-slope';
 if(band&&band.strength>.34&&name!=='rocky-slope'&&name!=='riparian')name=band.kind==='river-grove'?'riparian':band.kind;
 return {x,z,y,d,slope,moisture,patch,cover,water,band,name};
}
function pickFamily(w,weights,x,z,channel){
 let sum=0;for(const v of Object.values(weights))sum+=v;let r=w.hash(x,z,channel)*sum;
 for(const [k,v]of Object.entries(weights)){r-=v;if(r<0)return k;}return Object.keys(weights)[0];
}
function pickList(w,list,x,z,channel){return list[Math.floor(w.hash(x,z,channel)*list.length)%list.length];}
function natureFeature(w,family,x,z,ix,iz,channel,h,scale=1){
 const list=NATURE_BY_FAMILY[family],r=w.hash(ix,iz,channel);let a=list[Math.floor(r*list.length)];
 if(family==='rock')a=list[r<.08?0:r<.28?1:r<.58?2:3];
 const size=(.82+.30*w.hash(ix,iz,channel+1))*a.width*scale;
 return {id:a.id,x,z,y:h.y,w:size,shift:w.theme==='dusk'?1:family==='rock'&&w.theme==='desert'?2:0,category:a.category,family,habitat:h.name,variant:a.variant,
 key:`${channel}:${ix}:${iz}`,shade:.96+.08*w.hash(ix,iz,channel+2),groundcover:a.category==='groundcover',footprint:size*(a.category==='tree'?.31:.35)};
}

// An art-family restriction is distinct from habitat placement. The archived
// nature catalogue stays attributable; this presentation uses the target's art.
function referenceArt(w,f){
 if(f.category==='tree'&&(f.habitat==='rocky-slope'||(w.theme==='coast'&&w.coastline(f.z)-f.x<18)))return null;
 if(!f.id.startsWith('n-'))return f;
 const r=w.hash(Math.floor(f.x*16),Math.floor(f.z*16),781),v=w.hash(Math.floor(f.x*16),Math.floor(f.z*16),782);
 let id,width=f.w,family=f.family,category=f.category;
 if(category==='tree'){
   id=['pine-a','pine-b','pine-c'][Math.floor(r*3)];family='conifer';width=clamp(f.w*(w.theme==='dusk'?1.12:.89),3.5,8.6);
 }else if(family==='cactus'){
   id=['cactus-a','cactus-b','cactus-low'][Math.floor(r*3)];width=2.2+v*1.3;
 }else if(family==='rock'){
   id=w.theme==='desert'?(r<.5?'rock-small':'rock-pebble'):(r<.50?'boulder-coast':'shore-stone');width=2.0+v*2.6;
 }else if(category==='groundcover'){
   if(r>.25)return null;
   if(family==='flower'&&w.theme==='coast'){id=r<.12?'flowers':v<.5?'orange-flowers':'orange-flowers-b';width=1.25+v*.8;family='flower';}
   else{id=w.theme==='desert'?'scrub-dry':'shrub-coast';width=1.2+v*.8;family=w.theme==='desert'?'dry-scrub':'shrub';}
 }else if(family==='deadwood'||family==='snag')return null;
 else{id=w.theme==='desert'?'cactus-low':'shrub-coast';width=1.6+v*1.4;family=w.theme==='desert'?'cactus':'shrub';}
 return {...f,id,w:width,family,variant:id,source:'reference-cutout',requestedFamily:f.family,shift:w.theme==='dusk'?1:0,footprint:width*(category==='tree'?.28:.32)};
}

function* structuredBandFeatures(w,cx,cz,blocked,crowded){
 if(w.theme==='coast')return yield* scenicFeatures(w,cx,cz);
 const out=[],z0=cz*64;
 for(const b of w.nearbyBands(z0+32)){
   const start=Math.max(z0-24,b.z0),end=Math.min(z0+88,b.z1);if(end<=start)continue;
   if(b.kind==='roadside-avenue'||b.kind==='forest-lane'){
     const spacing=18+4*w.hash(b.index,0,596),rows=b.kind==='roadside-avenue'?[b.side,-b.side]:[b.side],baseFamily=b.kind==='roadside-avenue'?(w.theme==='coast'?'conifer':'birch'):(w.hash(b.index,0,597)<.55?'conifer':'birch');
     for(let z=b.z0+spacing*.35+Math.ceil((start-b.z0-spacing*.35)/spacing)*spacing;z<end;z+=spacing){
       yield;const t=w.tangent(z),n=1/Math.hypot(1,t),lane=10.4+1.6*Math.sin(z*.023+b.wave);
       for(const side of rows){
         const x=w.route(z)+side*lane*n,zz=z-side*lane*t*n;if(Math.floor(x/64)!==cx||Math.floor(zz/64)!==cz)continue;
         const h=habitatAt(w,x,zz);if(h.y<1.8||h.d<10.2||h.slope>.34||blocked(x,zz,2.4)||crowded(x,zz,2.2))continue;
         const family=baseFamily==='birch'&&w.hash(b.index,Math.floor(z*10),598)<.18?'broadleaf':baseFamily;
         const f=natureFeature(w,family,x,zz,b.index,Math.floor(z*10),599,h,1.05+.16*h.cover);f.key=`band:${b.index}:${side}:${Math.round(z*10)}`;f.band=b.kind;out.push(f);
       }
     }
   }else if(b.kind==='cactus-belt'){
     for(let z=b.z0+Math.ceil((start-b.z0)/14)*14;z<end;z+=14){
       const center=w.bandCenter(b,z);
       for(let lane=-1;lane<=1;lane++){
         yield;const x=center+lane*(5.8+1.1*Math.sin(z*.031+b.wave)),zz=z+lane*.7;if(Math.floor(x/64)!==cx||Math.floor(zz/64)!==cz)continue;
         const h=habitatAt(w,x,zz);if(h.y<1.1||h.d<8.2||h.slope>.42||blocked(x,zz,1.1)||crowded(x,zz,1.0))continue;
         const family=lane===0||w.hash(b.index,lane+13,600)<.62?'cactus':'rock';
         const f=natureFeature(w,family,x,zz,b.index,Math.floor(z*10)+lane,601,h,family==='cactus'?1.02:.90);f.key=`band:${b.index}:${lane}:${Math.round(z*10)}`;f.band=b.kind;out.push(f);
       }
     }
   }else if(b.kind==='river-grove'){
     for(let z=b.z0+6+Math.ceil((start-b.z0-6)/20)*20;z<end;z+=20){
       yield;const x=w.bandCenter(b,z),zz=z;if(Math.floor(x/64)!==cx||Math.floor(zz/64)!==cz)continue;
       const h=habitatAt(w,x,zz);if(h.y<1.4||h.d<10.2||h.slope>.34||blocked(x,zz,2.1)||crowded(x,zz,2.1))continue;
       const family=w.hash(b.index,Math.floor(z*10),602)<.62?'willow':'birch';
       const f=natureFeature(w,family,x,zz,b.index,Math.floor(z*10),603,h,1.08);f.key=`band:${b.index}:${Math.round(z*10)}`;f.band=b.kind;out.push(f);
     }
   }
 }
 return out;
}

// Four layers, globally owned points. Each chunk's neighbor set is disposable:
// ordering, camera position and cache eviction cannot alter the layout.
function* habitatFeatures(w,cx,cz){
 const out=[],trees=new Map(),x0=cx*64,z0=cz*64;
 const owned=f=>Math.floor(f.x/64)===cx&&Math.floor(f.z/64)===cz;
 const valid=h=>h.y>1.3&&h.d>7&&!(w.theme==='coast'&&h.x>w.coastline(h.z)-.8);
 const tree=(ix,iz)=>{
   const key=ix+':'+iz;if(trees.has(key))return trees.get(key);
   const x=(ix+.15+.70*w.hash(ix,iz,420))*11,z=(iz+.15+.70*w.hash(ix,iz,421))*11;
   const h=habitatAt(w,x,z);let f=null;
   const band=h.band?.kind,bonus=band==='roadside-avenue'||band==='coastal-grove'||band==='forest-lane'||band==='river-grove'||band==='fern-hollow'?0.20*h.band.strength:band==='flower-meadow'||band==='open-glade'?-.24*h.band.strength:0;
   if(w.theme!=='desert'&&!w.scenicReserve(x,z,2.4)&&valid(h)&&h.d>10&&h.slope<.65&&w.hash(ix,iz,422)<(w.theme==='dusk'?.08:.025)+.93*h.cover+bonus){
     let family;
     if(w.theme==='coast'&&w.sceneryFrame(z).wood<.55)family=w.hash(ix,iz,424)<.78?'broadleaf':'birch';
     else if(band==='roadside-avenue')family='conifer';
     else if(band==='coastal-grove')family=w.hash(ix,iz,424)<.42?'conifer':'broadleaf';
     else if(band==='forest-lane')family=w.hash(ix,iz,424)<.56?'conifer':'birch';
     else if(band==='river-grove'||h.name==='riparian')family=w.hash(ix,iz,424)<.63?'willow':'birch';
     else if(band==='fern-hollow')family=w.hash(ix,iz,424)<.72?'birch':'broadleaf';
     else if(h.name==='coastal-edge')family='conifer';
     else {const stand=w.noise(x*.018+14,z*.018-4,584);family=w.theme==='coast'?(stand<.43?'conifer':stand>.64?'birch':'broadleaf'):(stand<.43?'birch':'conifer');if(w.hash(ix,iz,424)<.18)family=pickFamily(w,HABITAT_RULES[w.theme].trees,ix,iz,424);}
     if(w.hash(ix,iz,423)<.025&&h.cover>.6&&band!=='roadside-avenue'&&band!=='forest-lane')family='snag';
     f=natureFeature(w,family,x,z,ix,iz,426,h,1.05+h.cover*.18);f.priority=w.hash(ix,iz,429);f.radius=f.w*.46;
     // Root footprints, not the entire standing crown, must meet the surface.
     if(h.slope*.8>.45)f=null;
   }
   trees.set(key,f);return f;
 };
 const accepted=(ix,iz)=>{
   const f=tree(ix,iz);if(!f)return null;
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){if(!i&&!j)continue;const o=tree(ix+i,iz+j);if(o&&o.priority<f.priority&&Math.hypot(f.x-o.x,f.z-o.z)<f.radius+o.radius)return null;}
   return f;
 };
 // Building/boat/post placement remains the existing global landmark rule.
 const originals=w.landmarkFeatures(cx,cz).filter(f=>f.key.startsWith('mark:')||f.key.startsWith('mesa:')||f.key.startsWith('post:')||f.boat);
 out.push(...originals);yield;
 // Prewarm only this chunk's finite neighbor halo, one candidate per yield.
 // Neighbor spacing queries never build a whole grove in a single frame.
 for(let iz=Math.floor((z0-48)/11);iz<=Math.ceil((z0+112)/11);iz++)for(let ix=Math.floor((x0-48)/11);ix<=Math.ceil((x0+112)/11);ix++){tree(ix,iz);yield;}
 const blocked=(x,z,r)=>w.siteExclusion(x,z,r);
 const crowded=(x,z,r)=>out.some(o=>Math.hypot(o.x-x,o.z-z)<(o.footprint||o.w*.28)+r);
 const bandRows=yield* structuredBandFeatures(w,cx,cz,blocked,crowded);out.push(...bandRows);yield;
 for(let iz=Math.floor(z0/11)-1;iz<=Math.floor((z0+64)/11);iz++){
   for(let ix=Math.floor(x0/11)-1;ix<=Math.floor((x0+64)/11);ix++){
     yield;const f=accepted(ix,iz);if(f&&owned(f)&&!blocked(f.x,f.z,f.radius)&&!crowded(f.x,f.z,f.radius*.55))out.push(f);
   }yield;
 }
 const canopy=(x,z)=>{let result=0;const ix=Math.floor(x/11),iz=Math.floor(z/11);
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const t=accepted(ix+i,iz+j);if(t&&!blocked(t.x,t.z,t.radius))result=Math.max(result,1-smooth(t.w*.22,t.w*.72,Math.hypot(x-t.x,z-t.z)));}return result;};
 // Shrubs and mineral/deadwood accents. Habitat selects groups before models.
 // Structural rows were placed before generic trees.

 for(let iz=Math.floor(z0/8);iz<Math.ceil((z0+64)/8);iz++){
   for(let ix=Math.floor(x0/8);ix<Math.ceil((x0+64)/8);ix++){
     yield;const x=(ix+.1+.8*w.hash(ix,iz,440))*8,z=(iz+.1+.8*w.hash(ix,iz,441))*8,h=habitatAt(w,x,z);
     if(!valid(h)||w.scenicReserve(x,z,1.5)||blocked(x,z,1.0)||crowded(x,z,.75))continue;
     if(w.theme==='coast'&&h.cover<.24&&h.water>17)continue;const r=w.hash(ix,iz,442),band=h.band?.kind;let family=null;
     if(w.theme==='desert'){
       if(band==='cactus-belt')family=r<.44?'cactus':r<.72?'rock':r<.90?'dry-grass':null;
       else if(band==='dry-wash')family=r<.22?'rock':r<.60?'dry-grass':null;
       else if(band==='rock-garden')family=r<.36?'rock':r<.54?'cactus':null;
       else family=r<.19?'cactus':r<.27?'rock':r<.43?'dry-grass':null;
     }else if(h.slope>.38)family=r<.35?'rock':null;
     else if(band==='shore-scrub')family=r<.12?'rock':r<.42?'shrub':r<.58?'berry':null;
     else if(band==='river-grove')family=r<.08?'rock':r<.26?'berry':r<.48?'shrub':null;
     else if(band==='open-glade')family=r<.03?'rock':r<.08?'deadwood':r<.13?'berry':null;
     else if(r<.045)family='rock';
     else if(r<.12&&h.cover>.5)family='deadwood';
     else if(r<.17&&h.cover>.5)family='berry';
     else if(r<.13+.30*h.cover)family='shrub';
     if(!family)continue;const f=natureFeature(w,family,x,z,ix,iz,444,h);
     if(h.slope*f.w>1.0||!owned(f)||canopy(x,z)>.65)continue;out.push(f);
   }yield;
 }
 // Cluster centers form empty areas and populated areas. A patch has one
 // dominant family/flower color; its child positions have independent offsets.
 for(let iz=Math.floor(z0/19)-1;iz<=Math.floor((z0+64)/19)+1;iz++){
   for(let ix=Math.floor(x0/19)-1;ix<=Math.floor((x0+64)/19)+1;ix++){
     yield;const px=(ix+.2+.6*w.hash(ix,iz,450))*19,pz=(iz+.2+.6*w.hash(ix,iz,451))*19,ph=habitatAt(w,px,pz),band=ph.band?.kind;
     if(w.theme==='coast'&&ph.cover<.26&&ph.water>16)continue;
     const patchGate=(w.theme==='desert'?.60:.46+.35*ph.patch)+(band==='flower-meadow'||band==='fern-hollow'?0.18:band==='open-glade'||band==='open-basin'?-0.12:0);
     if(w.hash(ix,iz,452)>patchGate)continue;
     const shade=canopy(px,pz);let family;
     if(w.theme==='desert')family='dry-grass';
     else if(band==='flower-meadow')family=w.hash(ix,iz,453)<.68?'flower':'grass';
     else if(band==='shore-scrub')family=w.hash(ix,iz,453)<.72?'grass':'flower';
     else if(band==='river-grove'||ph.name==='riparian')family=shade>.5?'fern':'reed';
     else if(band==='fern-hollow')family='fern';
     else if(band==='open-glade')family='grass';
     else if(shade>.35)family='fern';
     else family=pickFamily(w,HABITAT_RULES[w.theme].ground,ix,iz,453);
     if(family==='flower'&&ph.cover>.67&&band!=='flower-meadow')family='grass';
     const countScale=band==='flower-meadow'?1.35:band==='fern-hollow'||band==='river-grove'?1.22:band==='open-glade'||band==='open-basin'?0.75:1;
     const spreadScale=band==='flower-meadow'?1.28:band==='dry-wash'?1.10:band==='open-glade'?0.92:1;
     const count=Math.max(1,Math.round((2+Math.floor(w.hash(ix,iz,455)*(family==='dry-grass'?4:8)))*countScale)),angle=w.hash(ix,iz,456)*6.28,spread=(2.4+3*w.hash(ix,iz,457))*spreadScale,stretch=.5+.5*w.hash(ix,iz,458);
     for(let k=0;k<count;k++){
       yield;const a=w.hash(ix*11+k,iz,459)*6.28,r=Math.sqrt(w.hash(ix*13+k,iz,461))*spread,dx=Math.cos(a)*r,dz=Math.sin(a)*r*stretch,x=px+dx*Math.cos(angle)-dz*Math.sin(angle),z=pz+dx*Math.sin(angle)+dz*Math.cos(angle);
       if(Math.floor(x/64)!==cx||Math.floor(z/64)!==cz)continue;
       const h=habitatAt(w,x,z);if(!valid(h)||w.scenicReserve(x,z,.6)||h.slope>.43||blocked(x,z,.65)||crowded(x,z,.55)||canopy(x,z)>.80)continue;
       const f=natureFeature(w,family,x,z,ix,iz,460,h,.78+.26*w.hash(ix+k,iz,465));f.key=`cover:${ix}:${iz}:${k}`;f.patch=`${ix}:${iz}`;out.push(f);
     }
   }yield;
 }
 for(let i=out.length-1;i>=0;i--){const f=referenceArt(w,out[i]);if(f)out[i]=f;else out.splice(i,1);}
 // Calculate static contact shadows during budgeted construction, not on the
 // first displayed frame after a dense chunk loads.
 for(let k=0;k<out.length;k++){
   const f=out[k];if(!f.boat&&!f.groundcover){const ww=f.footprint||f.w*.35,ll=f.w*.22;
     f.groundShadow=[[-ww,-ll,0,0],[ww,-ll,1,0],[-ww,ll,0,1],[ww,ll,1,1]].map(([x,z,u,v])=>[f.x+x,w.height(f.x+x,f.z+z)+.065,f.z+z,u,v]);}
   if(k%2===0)yield;
 }
 return out;
}

class World{
 constructor(seed=1307,theme='coast'){this.seed=seed>>>0;this.theme=theme;this.p=THEMES[theme];this.phase=this.hash(17,13)*6.28318;this.palette=this.p.ground.map(hex);this.rock=hex(this.p.rock);this.shore=hex(this.p.shore);}
 hash(x,z,channel=0){let h=(Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(channel+1,1442695041)^this.seed)>>>0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
 noise(x,z,k=0){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return lerp(lerp(this.hash(ix,iz,k),this.hash(ix+1,iz,k),u),lerp(this.hash(ix,iz+1,k),this.hash(ix+1,iz+1,k),u),v);}
 route(z){if(this.theme==='coast'){const q=this.sceneryFrame(z);return q.valley+13*Math.sin(z*.025+this.phase)+4*Math.sin(z*.050+this.phase*.6);}return 18*Math.sin(z*.019+this.phase)+9*Math.sin(z*.041+this.phase*.43)+5*Math.sin(z*.009+this.phase*1.8);}
 tangent(z){if(this.theme==='coast')return (this.route(z+.1)-this.route(z-.1))/.2;return 18*.019*Math.cos(z*.019+this.phase)+9*.041*Math.cos(z*.041+this.phase*.43)+5*.009*Math.cos(z*.009+this.phase*1.8);}
 roadHeight(z){if(this.theme==='coast')return this.coastGround(this.route(z),z);return (this.theme==='coast'?16:this.theme==='desert'?8:9)+2.9*Math.sin(z*.011+this.phase)+1.1*Math.sin(z*.031+this.phase*.6);}
 edge(z){return this.route(z)+35+15*this.gradient(z*.014+13,2.2,271)+8*this.gradient(z*.042-8,5.4,272);}
 coastlineRaw(z){if(this.theme==='coast'){const q=this.sceneryFrame(z);let x=q.coast+4*Math.sin(z*.023+this.phase)+2.5*this.gradient(z*.052,4.3,714);
   for(const n of this.nearbyScenery(z))if(n.kind==='cove'){const d=z-n.z;x-=5*Math.exp(-Math.pow(d/23,2));x+=5*Math.exp(-Math.pow((d-35)/12,2))+4*Math.exp(-Math.pow((d+35)/15,2));}return x;}return this.edge(z)+2.8*this.gradient(z*.087,4.3,274);}
 coastline(z){const z0=Math.floor(z/2)*2;return lerp(this.coastlineRaw(z0),this.coastlineRaw(z0+2),(z-z0)/2);}
 // Gradient noise with quintic interpolation. Rotated octaves remove lattice
 // alignment; all inputs are absolute world coordinates, never chunk-local.
 gradient(x,z,k=0){
   const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
   const fade=t=>t*t*t*(t*(t*6-15)+10),u=fade(fx),v=fade(fz);
   const dot=(i,j,dx,dz)=>{const h=Math.floor(this.hash(i,j,k)*8);return h===0?dx:h===1?-dx:h===2?dz:h===3?-dz:h===4?(dx+dz)*.7071:h===5?(dx-dz)*.7071:h===6?(-dx+dz)*.7071:(-dx-dz)*.7071;};
   return lerp(lerp(dot(ix,iz,fx,fz),dot(ix+1,iz,fx-1,fz),u),lerp(dot(ix,iz+1,fx,fz-1),dot(ix+1,iz+1,fx-1,fz-1),u),v)*1.55;
 }
 fbm(x,z,k){let sum=0,amp=.57;for(let i=0;i<3;i++){sum+=amp*this.gradient(x,z,k+i*19);const xx=x;x=(x*.8+z*.6)*2.03+13.7;z=(-xx*.6+z*.8)*2.03-9.3;amp*=.48;}return sum;}
 geology(x,z){
   const wx=x+18*this.gradient(x*.006+4,z*.006-9,201),wz=z+18*this.gradient(x*.006-12,z*.006+3,202);
   const broad=this.fbm(wx*.008,wz*.008,211),ridge=this.fbm(wx*.020,wz*.013,231);
   const detail=this.gradient(wx*.070,wz*.070,251),drain=this.gradient(wx*.014+18,wz*.014-7,261);
   // Medium branches follow the warped low-frequency field. This is a
   // drainage-shaped filter, not a hydraulic simulation or a basin solver.
   const gully=(1-smooth(.025,.17,Math.abs(drain+.15*this.gradient(wx*.041,wz*.039,263))));
   return {wx,wz,broad,ridge,detail,gully};
 }

 scenery(index){
   this.sceneryCache??=new Map();if(this.sceneryCache.has(index))return this.sceneryCache.get(index);
   const r=this.hash(index,0,701),kind=r<.26?'cove':r<.39?'flower-fields':r<.67?'woodland':'meadow';
   return scenicCache(this.sceneryCache,index,{index,z:index*320+48+(this.hash(index,1,701)-.5)*54,
     valley:(this.hash(index,2,702)-.5)*20,floor:15+4*this.hash(index,3,703),hill:10+8*this.hash(index,4,704),
     width:47+16*this.hash(index,5,705),coast:(this.hash(index,2,702)-.5)*20+44+9*this.hash(index,6,706)+(kind==='cove'?5:0),
     kind,rowSpacing:3*this.hash(index,7,707),phase:this.hash(index,8,708)*6.28318},32);
 }
 nearbyScenery(z){const i=Math.floor((z-48)/320);return [this.scenery(i-1),this.scenery(i),this.scenery(i+1),this.scenery(i+2)];}
 sceneryFrame(z){
   this.frameCache??=new Map();if(this.frameCache.has(z))return this.frameCache.get(z);
   let i=Math.floor((z-48)/320);if(z<this.scenery(i).z)i--;else if(z>this.scenery(i+1).z)i++;
   const a=this.scenery(i),b=this.scenery(i+1),t=clamp((z-a.z)/(b.z-a.z)),u=t*t*t*(10+t*(-15+6*t));
   const val=k=>lerp(a[k],b[k],u),nearest=t<.5?a:b;
   return scenicCache(this.frameCache,z,{a,b,t,u,kind:nearest.kind,index:nearest.index,valley:val('valley'),floor:val('floor'),hill:val('hill'),width:val('width'),coast:val('coast'),
     cove:lerp(a.kind==='cove'?1:0,b.kind==='cove'?1:0,u),wood:lerp(a.kind==='woodland'?1:0,b.kind==='woodland'?1:0,u),
     flowers:lerp(a.kind==='flower-fields'?1:0,b.kind==='flower-fields'?1:0,u)},512);
 }
 coastGround(x,z){
   const q=this.sceneryFrame(z),dx=x-q.valley;
   // Large shoulders and transverse folds belong to the valley, not the road.
   const ridge=Math.exp(-Math.pow((dx+57)/q.width,2)),second=Math.exp(-Math.pow((dx-68)/55,2));
   const folds=1.7*Math.sin(z*.029+dx*.022+this.phase)+.9*this.gradient(x*.013,z*.013,711);
   const valleyFloor=q.floor+.45*Math.sin(z*.015+this.phase)+.18*this.gradient(x*.029,z*.022,712);
   const relief=q.hill*ridge+(3+q.hill*.25)*second;
   return valleyFloor+relief*(.84+.16*Math.sin(z*.019+this.phase))+folds*smooth(8,37,Math.abs(dx));
 }
 coastHeight(x,z){
   const q=this.sceneryFrame(z),d=this.coastline(z)-x,top=this.coastGround(x,z);
   // Three broad exposed strata; small fault offsets are global, never cache tiles.
   const f0=2.4*this.gradient(z*.035,3.2,715),f1=3.0*this.gradient(z*.031,7.4,716),f2=3.3*this.gradient(z*.028,9.1,717);
   const shelf=.55+(top-.55)*(.34*smooth(-1.2,1.6,d+f0)+.31*smooth(4.0,6.2,d+f1)+.35*smooth(10.0,13.1,d+f2));
   const headland=lerp(-2.8,shelf,smooth(-8,-2.4,d));
   const cove=lerp(-2.8,top,smooth(-7,15,d));
   let h=lerp(headland,cove,q.cove*.62);
   const rd=(x-this.route(z))/Math.hypot(1,this.tangent(z));
   return lerp(this.roadHeight(z),h,smooth(8.5,19,Math.abs(rd)));
 }
 parcels(index){
   this.parcelCache??=new Map();if(this.parcelCache.has(index))return this.parcelCache.get(index);
   const n=this.scenery(index),out=[];
   if(n.kind==='flower-fields')for(let k=0;k<3;k++){
     const z=n.z+(k-1)*77+(this.hash(index,k,722)-.5)*12,side=k===1?1:-1,q=this.sceneryFrame(z);
     const rx=side<0?25+8*this.hash(index,k,723):17+4*this.hash(index,k,723),rz=32+5*this.hash(index,k,724);
     const angle=(this.hash(index,k,725)-.5)*.48,crop=n.kind==='flower-fields'?(k===1?'yellow':'purple'):(k===1?'grain':'meadow');
     out.push({id:`${index}:${k}`,index:index*3+k,k,z,x:q.valley+side*(rx+19),rx,rz,side,angle,cos:Math.cos(angle),sin:Math.sin(angle),
       phase:n.phase,spacing:n.kind==='flower-fields'?4.3:5.3,crop,reach:index});
   }
   return scenicCache(this.parcelCache,index,out,32);
 }
 nearbyParcels(z){const i=Math.floor((z-48)/320),out=[];for(let k=i-1;k<=i+2;k++)out.push(...this.parcels(k));return out;}
 parcelPoint(f,u,v){const bend=7.5*Math.sin(v*.035+f.phase)+.0025*v*v;return[f.x+(u+bend)*f.cos-v*f.sin,f.z+(u+bend)*f.sin+v*f.cos];}
 parcelMask(f,x,z){
   const dx=x-f.x,dz=z-f.z,v=-dx*f.sin+dz*f.cos,u=dx*f.cos+dz*f.sin-(7.5*Math.sin(v*.035+f.phase)+.0025*v*v);
   const boundary=Math.pow(Math.abs(u)/f.rx,2.8)+Math.pow(Math.abs(v)/f.rz,2.8);
   return 1-smooth(.80,1.03,boundary);
 }
 parcelUse(x,z){
   if(this.theme!=='coast')return null;let best=null;
   const rd=Math.abs(x-this.route(z))/Math.hypot(1,this.tangent(z)),land=this.coastline(z)-x;
   if(rd<11||land<14)return null;
   for(const f of this.nearbyParcels(z)){
     if(Math.abs(x-f.x)>f.rx+28||Math.abs(z-f.z)>f.rz+28)continue;
     const weight=this.parcelMask(f,x,z)*smooth(11,16,rd)*smooth(14,22,land);
     if(weight>.001&&(!best||weight>best.weight))best={parcel:f,weight};
   }return best;
 }
 scenicReserve(x,z,r=0){
   if(this.theme!=='coast')return false;
   const field=this.parcelUse(x,z);if(field&&field.weight>.05)return true;
   const d=Math.abs(x-this.route(z))/Math.hypot(1,this.tangent(z));
   for(const n of this.nearbyScenery(z))if((n.kind==='woodland'||n.kind==='flower-fields')&&Math.abs(z-n.z)<112+r&&Math.abs(d-13.4)<3.9+r)return true;
   return false;
 }
 scenicColor(x,z,color,slope){
   if(this.theme!=='coast')return color;
   const field=this.parcelUse(x,z);
   if(field)color=mix3(color,hex(SCENIC_COLORS[field.parcel.crop].soil),field.weight*(field.parcel.crop==='meadow'?.18:.72));
   return color;
 }

 landHeight(x,z){return this.height(x,z);}
 height(x,z){
   if(this.theme==='coast')return this.coastHeight(x,z);
   const t=this.tangent(z),roadD=(x-this.route(z))/Math.hypot(1,t),g=this.geology(x,z),road=this.roadHeight(z);
   let h;
   if(this.theme==='desert'){
     const bed=g.ridge+.28*g.broad,talus=smooth(-.27,.36,bed),cap=smooth(.11,.32,bed);
     const relief=2+talus*1.8+cap*2.0;
     h=5.8+g.broad*2+relief;h-=g.gully*.45;h+=g.detail*.09;
   }else{
     const river=this.edge(z)+6+7*this.gradient(z*.014+8,2.9,279),rd=x-river;
     const width=6+4*smooth(-.5,.5,this.gradient(z*.013,5.7,280));
     const ridges=smooth(-.35,.48,g.broad+g.ridge*.65),upland=smooth(12,82,Math.abs(roadD));
     // Low river terraces meet the existing road grade. Taller ridges grow
     // farther inland, instead of cutting a narrow trench through a high slab.
     h=8.2+g.broad*3+upland*(5+13*ridges)+g.ridge*2-g.gully*.8+g.detail*.25;
     h=lerp(-2.5,h,smooth(width*.67,width+19,Math.abs(rd)));
   }
   // Protected road corridor is geometric, not a material band. At least one
   // full terrain cell surrounds the asphalt to prevent triangle overhang.
   return lerp(road,h,smooth(8.5,23,Math.abs(roadD)));
 }
 sample(x,z,landOnly=false){
   const h=this.height(x,z),e=1.5,hx=this.height(x+e,z)-this.height(x-e,z),hz=this.height(x,z+e)-this.height(x,z-e),len=Math.hypot(hx,2*e,hz),n=[-hx/len,2*e/len,-hz/len];
   const g=this.geology(x,z),slope=1-n[1];
   // Moisture and exposed earth are separate, warped fields, with smaller
   // inclusions inside the broad regions. Neither uses chunk IDs or rounding.
   const moisture=.5+(this.theme==='coast'?.34:.68)*this.fbm(g.wx*(this.theme==='coast'?.010:.024),g.wz*(this.theme==='coast'?.010:.024),291)+g.gully*.08;
   let color=mix3(this.palette[2],this.palette[0],smooth(.30,.48,moisture));
   color=mix3(color,this.palette[1],smooth(.57,.72,moisture));
   const soil=this.fbm(g.wx*.057,g.wz*.053,307),earth=this.theme==='coast'?hex('#bcb88b'):this.theme==='desert'?hex('#d39872'):hex('#8d839a');
   color=mix3(color,earth,(this.theme==='coast'?.12:.38)*smooth(.045,.20,soil)*(1-slope));
   color=this.scenicColor(x,z,color,slope);
   if(this.theme!=='desert')color=mix3(color,this.palette[2],this.woodland(x,z)*.23*(1-slope));
   color=mix3(color,this.rock,(this.theme==='dusk'?.65:.90)*smooth(.055,.32,slope));
   if(this.theme==='desert'){
     const strata=.5+.5*Math.sin(h*.82+g.broad*.7);
     color=mix3(color,hex('#e1a17b'),.24*strata*smooth(.05,.22,slope));
   }
   // Wet-bank color is evaluated by height per fragment, not smeared up cliff vertices.
   const light=clamp(n[0]*-.58+n[1]*.75+n[2]*.32),shade=lerp(.73+.32*light,.94+.06*light,this.theme==='desert'?0:1-smooth(.3,2.5,h));
   const fleck=this.gradient(x*.23,z*.23,323)*.012;
   return {h,n,color:this.placeMaterial(x,z,color.map(c=>c*(shade+fleck)))};
 }
 terrainVertex(x,z){
   const d=Math.abs(x-this.route(z))/Math.hypot(1,this.tangent(z)),weight=smooth(10,16,d)*.12;
   return [x+(this.hash(x/2,z/2,331)-.5)*weight,z+(this.hash(x/2,z/2,332)-.5)*weight];
 }

 woodland(x,z){
   if(this.theme==='coast'){const q=this.sceneryFrame(z),forest=this.noise(x*.011-5,z*.010+11,413),field=this.parcelUse(x,z);
     const d=Math.abs(x-this.route(z));let cover=smooth(.57,.73,forest)*(.86+.13*q.wood);
     cover=Math.max(cover,q.wood*smooth(15,31,d)*.76);
     if(field)cover*=1-field.weight;return clamp(cover);}
   const broad=this.noise(x*.011-5,z*.011+11,413),edge=this.noise(x*.031+3,z*.026-7,579);let cover=smooth(.39,.62,broad*.82+edge*.18);
   const band=this.bandInfluence(x,z);if(band){
     if(band.kind==='roadside-avenue'||band.kind==='coastal-grove'||band.kind==='forest-lane'||band.kind==='river-grove'||band.kind==='fern-hollow')cover=clamp(cover+.18*band.strength);
     if(band.kind==='flower-meadow'||band.kind==='shore-scrub'||band.kind==='open-glade'||band.kind==='open-basin'||band.kind==='dry-wash'||band.kind==='cactus-belt')cover=clamp(cover-.22*band.strength);
   }
   return cover;
 }
 band(index){
   this.bandCache??=new Map();if(this.bandCache.has(index))return this.bandCache.get(index);
   const pool=HABITAT_RULES[this.theme].bands,kind=pool[((index%pool.length)+pool.length)%pool.length],length=150+110*this.hash(index,1,591),z0=index*128-48+(this.hash(index,2,592)-.5)*42;
   const band={index,kind,z0,z1:z0+length,side:this.hash(index,3,593)<.5?-1:1,width:kind==='roadside-avenue'||kind==='forest-lane'?9+3*this.hash(index,4,594):kind==='cactus-belt'?13+4*this.hash(index,4,594):kind==='river-grove'?10+3*this.hash(index,4,594):kind==='flower-meadow'||kind==='open-glade'?18+6*this.hash(index,4,594):11+4*this.hash(index,4,594),offset:10+20*this.hash(index,5,595),wave:this.hash(index,6,596)*6.28318,sway:2+5*this.hash(index,7,597)};
   if(this.bandCache.size>=40)this.bandCache.delete(this.bandCache.keys().next().value);this.bandCache.set(index,band);return band;
 }
 bandCenter(b,z){
   const base=this.route(z),coast=this.coastline(z),river=this.edge(z)+6+7*this.gradient(z*.014+8,2.9,279),sway=Math.sin(z*.014+b.wave)*b.sway;
   switch(b.kind){
     case 'roadside-avenue':return base+b.side*(13.5+b.offset*.18+sway*.35);
     case 'coastal-grove':return Math.min(coast-13.5,base-b.side*(18+b.offset*.30)+sway);
     case 'flower-meadow':return base+b.side*(18+b.offset*.42)+sway*1.2;
     case 'shore-scrub':return coast-(6+b.offset*.15)+sway*.45;
     case 'cactus-belt':return base+b.side*(20+b.offset*.50)+sway*1.6;
     case 'dry-wash':return base+b.side*(14+b.offset*.44)+sway*2.1;
     case 'rock-garden':return base+b.side*(26+b.offset*.34)+sway*1.2;
     case 'forest-lane':return base+b.side*(14+b.offset*.20+sway*.30);
     case 'river-grove':return river-(4+b.offset*.12)+sway*.55;
     case 'fern-hollow':return base+b.side*(16+b.offset*.34)+sway*.8;
     case 'open-glade':return base+b.side*(20+b.offset*.36)+sway*1.1;
     case 'open-basin':return base+b.side*(24+b.offset*.42)+sway*1.5;
     default:return base+b.side*(18+b.offset*.30)+sway;
   }
 }
 nearbyBands(z){const out=[];for(let i=Math.floor((z+96)/128)-2;i<=Math.floor((z+96)/128)+2;i++)out.push(this.band(i));return out;}
 bandInfluence(x,z){
   let best=null;for(const b of this.nearbyBands(z)){
     if(z<b.z0-8||z>b.z1+8)continue;const center=this.bandCenter(b,z),half=(b.z1-b.z0)*.5||1,along=Math.abs(z-(b.z0+b.z1)*.5)/half,across=Math.abs(x-center);
     const strength=(1-smooth(b.width*.55,b.width*1.08,across))*(1-smooth(.84,1.08,along));
     if(strength>.02&&(!best||strength>best.strength))best={...b,center,along,across,strength};
   }return best;
 }
 site(index){const it=this.prepareSite(index);let p;do{p=it.next();}while(!p.done);return p.value;}
 *prepareSite(index){
   this.siteCache??=new Map();if(this.siteCache.has(index))return this.siteCache.get(index);
   const base=index*192+46+(this.hash(index,2,571)-.5)*(this.theme==='coast'?94:22);
   const scenic=this.theme==='coast'?this.sceneryFrame(base):null;
   const kind=this.theme==='desert'?'outcrop':this.theme==='dusk'?'cabin':((index%3)+3)%3===0?'lighthouse':'cottage';
   let result=null,best=Infinity;
   for(const dz of [0,-18,18,36,-36])for(const inset of [10,16,22]){
     yield;
     const z=base+dz,side=this.theme==='dusk'||(kind==='cottage'&&(this.theme==='coast'||index%2))?-1:1;
     let x=this.theme==='coast'&&side>0?Math.max(this.route(z)+14,this.coastline(z)-inset):this.route(z)+side*(inset+7);
     const y=this.height(x,z),d=Math.abs(x-this.route(z))/Math.hypot(1,this.tangent(z));
     if(y<4||d<12||d>(this.theme==='coast'?48:35)||(this.theme==='coast'&&x>this.coastline(z)-5))continue;
     const hh=[this.height(x-2,z-2),this.height(x+2,z-2),this.height(x-2,z+2),this.height(x+2,z+2)];
     const slope=Math.max(...hh)-Math.min(...hh);if(slope>1.15)continue;
     const t=this.tangent(z),n=1/Math.hypot(1,t),ax=this.route(z)+side*5.2*n,az=z-side*5.2*t*n;
     const middle=[lerp(ax,x,.54),lerp(az,z,.54)+4*side];
     if(this.height(...middle)<1.5)continue;
     const field=this.parcelUse(x,z),edgePenalty=field?field.weight*2:0;
     const score=slope*3+Math.abs(dz)*(this.theme==='coast'?.012:.022)+Math.abs(d-(this.theme==='coast'?26:19))*.04+edgePenalty;
     if(score<best){best=score;result={index,kind,x,z,y,side,radius:kind==='lighthouse'?6.2:kind==='outcrop'?5:7.0,path:[[ax,az],middle,[x,z]],key:`site:${index}`};}
   }
   if(this.siteCache.size>=48)this.siteCache.delete(this.siteCache.keys().next().value);
   this.siteCache.set(index,result);return result;
 }
 nearbySites(z){const a=[];for(let i=Math.floor(z/192)-1;i<=Math.floor(z/192)+1;i++){const p=this.site(i);if(p)a.push(p);}return a;}
 siteDistance(x,z,p){
   let path=Infinity;for(let i=0;i<2;i++){const a=p.path[i],b=p.path[i+1],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));path=Math.min(path,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}
   return {court:Math.hypot((x-p.x)*.9,(z-p.z)*1.08),path};
 }
 siteExclusion(x,z,r=0){for(const p of this.nearbySites(z)){if(Math.abs(x-p.x)>40||Math.abs(z-p.z)>40)continue;const d=this.siteDistance(x,z,p);if(d.court<p.radius+r||d.path<1.6+r)return true;}return false;}
 placeMaterial(x,z,color){
   for(const p of this.nearbySites(z)){
     if(Math.abs(x-p.x)>40||Math.abs(z-p.z)>40)continue;
     const d=this.siteDistance(x,z,p),court=1-smooth(p.radius*.56,p.radius+1.5,d.court),path=1-smooth(.9,2.15,d.path);
     const roadD=Math.abs(x-this.route(z))/Math.hypot(1,this.tangent(z));
     const amount=Math.max(court*.68,path*.78)*smooth(4.85,6.1,roadD);
     const earth=hex(this.theme==='dusk'?'#958e9b':this.theme==='desert'?'#c99e80':'#c5bf9b');
     color=mix3(color,earth,amount);
   }return color;
 }
 siteFeatures(cx,cz){
   const out=[],owned=f=>Math.floor(f.x/64)===cx&&Math.floor(f.z/64)===cz;
   for(const p of this.nearbySites(cz*64+32)){
     if(this.theme!=='desert'){
       const id=p.kind==='cabin'?'cottage-night':p.kind==='lighthouse'?'lighthouse':'cottage';
       const f={id,x:p.x,z:p.z,y:p.y,w:p.kind==='lighthouse'?8.2:8.0,shift:0,key:`mark:${p.index}`,site:p.key};if(owned(f))out.push(f);
     }
     if(this.theme==='desert'){const f={id:this.hash(p.index,0,786)<.5?'rock-a':'rock-b',x:p.x,z:p.z,y:p.y,w:12+8*this.hash(p.index,1,786),family:'mesa',category:'mineral',key:`mesa:${p.index}`,site:p.key,shift:0};if(owned(f))out.push(f);}
     // A few framing objects explain a place. They use real catalog assets,
     // ordinary suitability checks and final-position chunk ownership.
     const offsets=this.theme==='desert'?[[4,-4],[-5,-5],[7,4],[-7,3]]:[[8,-7],[-8,-8],[9,7],[-8,7],[4,10]];
     for(let k=0;k<offsets.length;k++){
       const [ox,oz]=offsets[k],x=p.x+ox*p.side,z=p.z+oz,h=habitatAt(this,x,z);
       if(h.y<1.5||h.d<10.5||h.slope>.38||(this.theme==='coast'&&x>this.coastline(z)-1))continue;
       const family=this.theme==='desert'?(k<2?'rock':k===2?'cactus':'dry-grass'):k<2?(this.theme==='dusk'?'birch':'broadleaf'):k===2?'rock':this.theme==='dusk'?'fern':'flower';
       const f=natureFeature(this,family,x,z,p.index,k,585,h,k<2?1.16:1.0);f.key=`mark:${p.index}:support:${k}`;f.site=p.key;
       if(f.category==='tree'&&h.d<13)continue;if(f.family==='rock'&&h.slope*f.w>1.1)continue;if(owned(f))out.push(f);
     }
   }return out;
 }

 features(cx,cz){const g=habitatFeatures(this,cx,cz);let step;do{step=g.next();}while(!step.done);return step.value;}
 landmarkFeatures(cx,cz){
   const out=[],startX=cx*64,startZ=cz*64;
   const add=(id,x,z,w,shift=0,key="",extra={})=>out.push({id,x,z,y:this.height(x,z),w,shift,key,...extra});
   out.push(...this.siteFeatures(cx,cz));
   if(this.theme!=='desert')for(let i=Math.floor(startZ/12)-1;i<=Math.floor((startZ+64)/12)+1;i++){
     const z=i*12;if(this.theme==='coast'&&(Math.abs(this.tangent(z))<.22||i%2!==0))continue;const t=this.tangent(z),n=1/Math.hypot(1,t),x=this.route(z)+6.3*n,zz=z-6.3*t*n;
     if(Math.floor(x/64)===cx&&Math.floor(zz/64)===cz)add('road-post',x,zz,1.05,this.theme==='dusk'?1:0,`post:${i}`);
   }
   if(this.theme==='coast')for(let i=Math.floor(startZ/156)-1;i<=Math.floor((startZ+64)/156)+1;i++){
     const z=i*156+94,x=this.coastline(z)+26;if(this.hash(i,0,787)<.18)continue;
     if(Math.floor(x/64)===cx&&Math.floor(z/64)===cz)out.push({id:'sailboat',x,z,y:.36,w:7.1,shift:0,boat:true,key:`boat:${i}`});
   }
   if(this.theme==='desert')for(let j=Math.floor(startZ/64)-1;j<=Math.floor((startZ+64)/64);j++)for(const side of [-1,1]){
     const z=j*64+10+this.hash(j,side,790)*38,x=this.route(z)+side*(28+this.hash(j,side,791)*30),w=9+this.hash(j,side,792)*11;
     if(Math.floor(x/64)!==cx||Math.floor(z/64)!==cz||this.hash(j,side,793)>.70)continue;
     const h=habitatAt(this,x,z);if(h.d<20||h.slope>.32||this.siteExclusion(x,z,w*.6))continue;
     out.push({id:this.hash(j,side,794)<.5?'rock-a':'rock-b',x,z,y:h.y,w,shift:0,key:`mesa:group:${j}:${side}`,family:'mesa',category:'mineral',footprint:w*.48});
   }
   if(this.theme==='coast')for(let i=Math.floor(startZ/26)-1;i<=Math.floor((startZ+64)/26)+1;i++){
     const z=i*26+this.hash(i,0,788)*9,x=this.coastline(z)+3+this.hash(i,1,788)*8;
     if(Math.floor(x/64)!==cx||Math.floor(z/64)!==cz||this.hash(i,2,788)>.62)continue;
     out.push({id:'boulder-coast',x,z,y:.24,w:3.5+3.8*this.hash(i,3,788),shift:0,key:`shore:${i}`,family:'rock',category:'mineral',boat:true});
   }
   return out;
 }
}

// Authored micro-wagon: cream roof, chamfered body, inset glass, bumpers,
// lamps and four independently steered/rolling tyres. Forward is local -Z.
const CAR_SCALE=1.18,WHEELBASE=2.9*CAR_SCALE;
class Vehicle {
 constructor(world,z=80,lane=-1.5){this.reset(world,z,lane);}
 reset(w,z,lane=-1.5){const t=w.tangent(z),n=1/Math.hypot(1,t);this.x=w.route(z)+lane*n;this.z=z-lane*t*n;this.yaw=Math.atan2(-t,1);this.steering=0;this.wheelAngle=0;this.pathZ=z;this.distance=0;this.ground(w);}
 nearest(w){let z=this.pathZ;for(let i=0;i<4;i++){const t=w.tangent(z),curve=(w.tangent(z+.1)-w.tangent(z-.1))/.2;z-=clamp(((w.route(z)-this.x)*t+z-this.z)/(1+t*t+(w.route(z)-this.x)*curve),-12,12);}this.pathZ=z;const t=w.tangent(z);return ((this.x-w.route(z))-(this.z-z)*t)/Math.hypot(1,t);}
 step(w,state,dt,input=0){
   const lane=this.nearest(w),t=w.tangent(this.pathZ),look=7+state.speed*.11;
   const z=this.pathZ-look/Math.hypot(1,t),tt=w.tangent(z),nn=1/Math.hypot(1,tt);
   const targetX=w.route(z)-1.5*nn,targetZ=z+1.5*tt*nn;
   const desired=Math.atan2(targetX-this.x,-(targetZ-this.z));
   const error=Math.atan2(Math.sin(desired-this.yaw),Math.cos(desired-this.yaw));
   const pursuit=clamp(Math.atan2(2*WHEELBASE*Math.sin(error),Math.hypot(targetX-this.x,targetZ-this.z)),-.52,.52);
   // Assistance acts through the tyres, never by moving the car sideways.
   const wanted=state.auto?pursuit:lerp(input*.40,pursuit,smooth(5,9,Math.abs(lane))*.85);
   this.steering+=clamp(wanted-this.steering,-dt*.95,dt*.95);
   const curvature=Math.abs((w.tangent(z+2)-w.tangent(z-2))/4)/Math.pow(1+tt*tt,1.5);
   const curveLimit=state.auto?Math.max(24,Math.min(90,Math.sqrt(2.2/Math.max(.001,curvature))*3.6)):90;
   const target=Math.min(state.targetSpeed,curveLimit)*(Math.abs(lane)>5.4?.45:1);
   state.speed=lerp(state.speed,target,1-Math.exp(-dt*1.8));
   if(state.speed<.015&&target===0)state.speed=0;
   const travel=state.speed/3.6*dt*(state.calm?.35:.62),turn=travel/WHEELBASE*Math.tan(this.steering),mid=this.yaw+turn*.5;
   this.x+=Math.sin(mid)*travel;this.z-=Math.cos(mid)*travel;if(travel>0)this.yaw=Math.atan2(Math.sin(this.yaw+turn),Math.cos(this.yaw+turn));
   this.wheelAngle=(this.wheelAngle+travel/(.52*CAR_SCALE))%(Math.PI*2);this.distance+=travel;
   state.lane=this.nearest(w);state.steerLane=state.lane;state.distance=this.pathZ;state.travelled+=travel;this.ground(w);
 }
 ground(w){
   const sy=Math.sin(this.yaw),cy=Math.cos(this.yaw),contacts=[];
   for(const z of [-1.45*CAR_SCALE,1.45*CAR_SCALE])for(const x of [-1.24*CAR_SCALE,1.24*CAR_SCALE]){
     const xx=this.x+x*cy-z*sy,zz=this.z+x*sy+z*cy;
     const lane=Math.abs(xx-w.route(zz))/Math.hypot(1,w.tangent(zz));
     contacts.push({x:xx,z:zz,y:w.height(xx,zz)+(lane<5.4?.17:.035)});
   }
   this.contacts=contacts;this.y=contacts.reduce((s,p)=>s+p.y,0)/4;
   this.pitch=(contacts[2].y+contacts[3].y-contacts[0].y-contacts[1].y)/(5.8*CAR_SCALE);
   this.roll=(contacts[1].y+contacts[3].y-contacts[0].y-contacts[2].y)/(4.96*CAR_SCALE);
 }
}

function vehicleGeometry(out,car,theme,origin){
 const body=hex(theme==='desert'?'#d66b38':theme==='dusk'?'#554071':'#57a595'),roof=hex(theme==='dusk'?'#756789':'#f2edd8');
 const dark=hex('#283c41'),rubber=hex('#293135'),metal=hex('#b3b8aa'),glass=hex(theme==='dusk'?'#262641':'#29474e');
 const yaw=car.yaw,cy=Math.cos(yaw),sy=Math.sin(yaw);
 const world=p=>{const [x,y,z]=p.map(v=>v*CAR_SCALE);return[car.x-origin[0]+x*cy-z*sy,car.y+y+x*car.roll+z*car.pitch,car.z-origin[2]+x*sy+z*cy];};
 const face=(points,col)=>{
   const a=world(points[0]),b=world(points[1]),c=world(points[2]),u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);
   let nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0],len=Math.hypot(nx,ny,nz)||1;
   const light=.72+.28*Math.max(0,(-nx*.58+ny*.75+nz*.32)/len),color=col.map(c=>c*light);
   for(let i=1;i<points.length-1;i++)out.push(...a,...color,...world(points[i]),...color,...world(points[i+1]),...color);
 };
 const box=(x1,y1,z1,x2,y2,z2,col)=>{
   face([[x1,y2,z1],[x1,y2,z2],[x2,y2,z2],[x2,y2,z1]],col);
   face([[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]],col);
   face([[x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1]],col);
   face([[x2,y1,z2],[x2,y1,z1],[x2,y2,z1],[x2,y2,z2]],col);
   face([[x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1]],col);
 };
 box(-1.17,.47,-2.32,1.17,.81,2.31,dark);
 // Eight-point perimeter bevels preserve the compact illustrated silhouette.
 const ring=(y,w,zf,zr,b)=>[[-w+b,y,zf],[w-b,y,zf],[w,y,zf+b],[w,y,zr-b],[w-b,y,zr],[-w+b,y,zr],[-w,y,zr-b],[-w,y,zf+b]];
 const lower=ring(.67,1.26,-2.51,2.51,.18),belt=ring(1.40,1.39,-2.54,2.54,.17),top=ring(1.55,1.27,-2.40,2.40,.16);
 for(let i=0;i<8;i++){let j=(i+1)%8;face([lower[j],lower[i],belt[i],belt[j]],body);face([belt[j],belt[i],top[i],top[j]],body);}
 face([...top].reverse(),body);
 const cabLow=[[-1.27,1.51,-1.86],[1.27,1.51,-1.86],[1.27,1.51,2.02],[-1.27,1.51,2.02]],cabHigh=[[-1.08,2.52,-1.35],[1.08,2.52,-1.35],[1.10,2.52,1.48],[-1.10,2.52,1.48]];
 for(let i=0;i<4;i++){let j=(i+1)%4;face([cabLow[j],cabLow[i],cabHigh[i],cabHigh[j]],body);}
 face([[1.11,2.56,-1.40],[-1.11,2.56,-1.40],[-1.13,2.56,1.53],[1.13,2.56,1.53]],roof);
 box(-1.12,2.48,1.46,1.12,2.57,1.58,roof);
 face([[-1.01,1.70,1.934],[1.01,1.70,1.934],[.96,2.36,1.60],[-.96,2.36,1.60]],glass);
 face([[1.06,1.69,-1.781],[-1.06,1.69,-1.781],[-.95,2.37,-1.445],[.95,2.37,-1.445]],glass);
 // Side glazing is split by a solid B-pillar; two narrow door handles below.
 for(const side of [-1,1]){
   const points=(zf,zr)=>[[side*1.246,1.70,zf],[side*1.246,1.70,zr],[side*1.125,2.36,zr-.08],[side*1.125,2.36,zf+.24]];
   let front=points(-1.69,.03),rear=points(.20,1.75);if(side>0){front.reverse();rear.reverse();}face(front,glass);face(rear,glass);
   box(side>0?1.26:-1.32,1.38,-.11,side>0?1.32:-1.26,1.46,.19,metal);
   box(side>0?1.26:-1.32,1.38,1.48,side>0?1.32:-1.26,1.46,1.75,metal);
   box(side>0?1.25:-1.52,1.61,-1.62,side>0?1.52:-1.25,1.81,-1.30,body);
 }
 box(-1.20,.75,2.51,1.20,.94,2.64,metal);box(-1.20,.75,-2.64,1.20,.94,-2.51,metal);
 box(-.35,.97,2.548,.35,1.16,2.565,hex('#f2ebcf'));
 for(const side of [-1,1]){
   const x=side*.95;box(x-.20,1.04,2.54,x+.20,1.29,2.60,hex(theme==='dusk'?'#ff9e65':'#e68f43'));
   box(x-.23,1.07,-2.61,x+.23,1.35,-2.54,hex('#f4dfa2'));
 }
 box(-.48,1.03,-2.60,.48,1.26,-2.54,dark);
 for(const z of [-1.45,1.45])for(const side of [-1,1]){
   const steer=z<0?car.steering:0,cs=Math.cos(steer),sn=Math.sin(steer),centerX=side*1.29;
   const wp=(ax,r,a)=>{const zz=Math.sin(a)*r,xx=ax;return[centerX+xx*cs-zz*sn,.52+Math.cos(a)*r,z+xx*sn+zz*cs];};
   for(let i=0;i<12;i++){
     const a=i*Math.PI/6+car.wheelAngle,b=(i+1)*Math.PI/6+car.wheelAngle;
     face([wp(-.19,.52,a),wp(.19,.52,a),wp(.19,.52,b),wp(-.19,.52,b)],rubber);
     const ax=side*.20;face([wp(ax,0,0),wp(ax,.49,a),wp(ax,.49,b)],rubber);
     face([wp(ax+side*.01,0,0),wp(ax+side*.01,.25,a),wp(ax+side*.01,.25,b)],i%3===0?metal:hex('#697977'));
   }
 }
}

/* One actual WebGL renderer: the displayed landscape and exported pictures use
 * this same canvas. Props are imported reference-art sprites, never code-drawn.
 * Geometry is 3D; camera is a fixed, orthographic 35.264°/45° projection.
 */
// The same authored ellipsoids define cloud geometry AND sunlight occlusion.
// Entries are normalized center offsets and radii, in world X/Y/Z axes.
// Shape archetypes, not a weather simulation. WMO references distinguish
// shallow puffs, vertically developed cumulus and low layered banks.
const CLOUD_FAMILIES=[
 {id:'fair-low',lobes:[[-.15,-.02,.15,.27,.12,.25],[.005,.075,-.015,.26,.175,.25],[.20,-.025,-.20,.235,.105,.22],[-.30,-.05,.28,.14,.07,.14]]},
 {id:'broad-cumulus',lobes:[[-.22,-.02,.08,.30,.14,.24],[.00,.13,.01,.25,.24,.25],[.24,.015,-.05,.28,.145,.24],[.32,.075,.09,.17,.16,.18]]},
 {id:'tall-cumulus',lobes:[[-.14,-.02,.08,.29,.13,.27],[.03,.18,.0,.245,.29,.22],[.20,.03,-.11,.255,.15,.22],[-.08,.33,-.05,.14,.18,.14]]},
 {id:'layered-bank',lobes:[[-.35,-.035,.08,.28,.09,.24],[-.08,.025,.02,.32,.125,.25],[.23,-.01,-.06,.30,.095,.25],[.44,-.04,-.1,.18,.065,.18]]},
 {id:'broken-tuft',lobes:[[-.16,0,.04,.20,.11,.17],[.04,.075,-.02,.21,.16,.19],[.21,-.025,-.08,.16,.075,.14],[-.26,-.03,.08,.12,.065,.12]]}
];
// Flatten the shared definition so visible geometry and cast shade stay aligned.
for(const family of CLOUD_FAMILIES)for(const l of family.lobes){l[1]*=.72;l[4]*=.72;}
const CLOUD_LOBES=CLOUD_FAMILIES[0].lobes;
const SUN=[-.58,.75,.32],MAX_CLOUDS=16;
const cloudBase=c=>c.y-c.w*.055;
function cloudLobes(c){return CLOUD_FAMILIES[c.type||0].lobes.map(l=>({center:[c.x+l[0]*c.w,c.y+l[1]*c.w,c.z+l[2]*c.w],radii:l.slice(3).map(v=>v*c.w)}));}
function cloudOcclusion(point,cloud){
 let shade=0;
 for(const l of cloudLobes(cloud)){
   const softness=Math.max(0,(l.center[1]-point[1])*.022),r=l.radii.map(v=>v+softness),v=point.map((p,i)=>(p-l.center[i])/r[i]),d=SUN.map((p,i)=>p/r[i]);
   if(point[1]>l.center[1]+r[1])continue;
   const t=Math.max(0,(cloudBase(cloud)-softness-point[1])/SUN[1],-v.reduce((s,p,i)=>s+p*d[i],0)/d.reduce((s,p)=>s+p*p,0));
   const q=v.map((p,i)=>p+d[i]*t);shade=Math.max(shade,1-smooth(.40,1.10,q.reduce((s,p)=>s+p*p,0)));
 }return shade;
}
const CLOUD_SHADOW_GLSL=`
 float puffOcclusion(vec3 p,vec3 center,vec3 radii,float base){
   float softness=max(0.,center.y-p.y)*.022;vec3 r=radii+softness;
   vec3 v=(p-center)/r,d=vec3(-.58,.75,.32)/r;
   if(p.y>center.y+r.y)return 0.;float t=max(max(0.,(base-softness-p.y)/.75),-dot(v,d)/dot(d,d));vec3 q=v+t*d;
   return 1.-smoothstep(.40,1.10,dot(q,q));
 }
 float cloudShadow(vec3 p){float shadow=0.;
   for(int i=0;i<16;i++){if(float(i)>=uCloudCount)break;
     vec3 c=uClouds[i];float w=uCloudWidths[i].x,shape=uCloudWidths[i].y;
     vec2 hit=p.xz+vec2(-.58,.32)/.75*(c.y-p.y);
     if(dot(hit-c.xz,hit-c.xz)>w*w*1.3)continue;
     ${CLOUD_FAMILIES.map((s,i)=>(i?'else ':'')+'if(shape<'+(i+.5).toFixed(1)+'){'+s.lobes.map(l=>'shadow=max(shadow,puffOcclusion(p,c+vec3('+l.slice(0,3).map(v=>v.toFixed(4)).join(',')+')*w,vec3('+l.slice(3).map(v=>v.toFixed(4)).join(',')+')*w,c.y-w*.055));').join('\n')+'}').join('\n')}
   }return shadow;
 }`;
const CAMERA_AZIMUTH=18, CAMERA_ELEVATION=35.264389682754654;
const R=[0.9510565163,0.0000000000,-0.3090169944],U=[-0.1784110449,0.8164965809,-0.5490927357],F=[0.2523113194,0.5773502692,0.7765343938];
// Reuse CPU and GPU storage instead of allocating a new array/store every frame.
class FloatWriter{
 constructor(capacity){this.data=new Float32Array(capacity);this.length=0;this.gpuBytes=0;}
 push(...values){if(this.length+values.length>this.data.length){const next=new Float32Array(Math.max(this.data.length*2,this.length+values.length));next.set(this.data);this.data=next;}this.data.set(values,this.length);this.length+=values.length;}
 view(){return this.data.subarray(0,this.length);}
 upload(gl,buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(this.gpuBytes<this.data.byteLength){this.gpuBytes=this.data.byteLength;gl.bufferData(gl.ARRAY_BUFFER,this.gpuBytes,gl.DYNAMIC_DRAW);}gl.bufferSubData(gl.ARRAY_BUFFER,0,this.view());}
}
class Renderer{
 constructor(canvas,atlas,manifest,surface){
   this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false,powerPreference:'default'});
   if(!this.gl)throw Error('WebGL is unavailable. Please enable browser hardware acceleration.');
   this.assets=Object.fromEntries(manifest.assets.map(a=>[a.id,a]));this.chunks=new Map();this.roads=new Map();this.queue=[];this.totalFrames=0;this.loaded=0;this.origin=[0,0,0];this.target=[0,10,0];this.artProfile={halfHeight:50,lookAhead:32};this.halfH=50;this.halfW=77;
   const gl=this.gl;
   const projection=`uniform vec3 uOffset,uTarget;uniform vec2 uHalf;
    vec4 project(vec3 p){vec3 d=p-uTarget;return vec4(dot(d,vec3(0.9510565163,0.0000000000,-0.3090169944))/uHalf.x,dot(d,vec3(-0.1784110449,0.8164965809,-0.5490927357))/uHalf.y,-dot(d,vec3(0.2523113194,0.5773502692,0.7765343938))/300.,1.);}`;
   const tone=`precision highp float;uniform vec3 uFog;uniform float uLight,uTime,uMotion;uniform vec3 uTarget;uniform vec2 uGlobal;uniform vec3 uClouds[16],uCloudWidths[16];uniform float uCloudCount,uShadowStrength;
    ${CLOUD_SHADOW_GLSL}
    vec3 finish(vec3 c,vec3 p){c*=1.-cloudShadow(p)*uShadowStrength;float farDistance=-dot(p-uTarget,vec3(0.2523113194,0.5773502692,0.7765343938));float haze=smoothstep(12.,155.,farDistance)*.24;return mix(c*uLight,uFog,haze);}`;
   this.land=this.program(`attribute vec3 aPos,aColor;varying vec3 vColor,vPos;${projection}void main(){vPos=aPos+uOffset;vColor=aColor;gl_Position=project(vPos);}`,`${tone}varying vec3 vColor,vPos;void main(){gl_FragColor=vec4(finish(vColor,vPos),1.);}`);
   this.terrain=this.program(`attribute vec3 aPos,aColor;attribute vec4 aNormal;varying vec3 vColor,vPos;varying vec4 vNormal;${projection}void main(){vPos=aPos+uOffset;vColor=aColor;vNormal=aNormal;gl_Position=project(vPos);}`,`${tone}varying vec3 vColor,vPos;varying vec4 vNormal;uniform vec3 uShore;uniform float uHasWater,uTheme;uniform sampler2D uSurface;uniform vec2 uSurfacePhase;
 void main(){vec2 uv=(vPos.xz+uSurfacePhase)/64.;vec3 n=normalize(vNormal.xyz);
   vec3 pigment=texture2D(uSurface,uv).rgb;
   float light=.78+.24*max(0.,dot(n,normalize(vec3(-.58,.75,.32))));
   // The broad world material remains visible; the bounded palette supplies
   // irregular pixel clusters. Hardware filters the final RGB colors.
   vec3 turf=mix(pigment*light,vColor,.60);
   float slope=1.-n.y,grain=texture2D(uSurface,vec2(uv.x+vPos.y*.025,uv.y)).r;
   vec3 rock=vec3(.53,.52,.43);if(uTheme>.5&&uTheme<1.5)rock=vec3(.77,.43,.32);if(uTheme>1.5)rock=vec3(.36,.26,.48);
   rock*=light*(.94+.12*grain);
   float strata=.5+.5*sin(vPos.y*.65+sin((vPos.z+uGlobal.y)*.09));rock*=.92+.09*strata;
   vec3 color=mix(turf,rock,max(vNormal.w,smoothstep(.16,.48,slope)));
   color=mix(color,uShore,(1.-smoothstep(.25,1.15,vPos.y))*uHasWater);
   gl_FragColor=vec4(finish(color,vPos),1.);
 }`);
   this.water=this.program(`attribute vec3 aPos;varying vec3 vPos;${projection}void main(){vPos=aPos+uOffset;gl_Position=project(vPos);}`,`${tone}varying vec3 vPos;uniform vec3 uBase;uniform float uNight;uniform sampler2D uSurface;uniform vec2 uSurfacePhase;
    void main(){vec2 p=vPos.xz+uGlobal,uv=(vPos.xz+uSurfacePhase)/64.;
      float patch=texture2D(uSurface,uv*vec2(.5,1.)).r;
      float tide=sin(p.x*.12+p.y*.09-uTime*.13*uMotion);
      vec3 c=uBase+(patch-.65)*.075+tide*.006;
      gl_FragColor=vec4(finish(c,vPos),1.);
    }`);
   // The ordinary ocean remains one quiet plane. Only cells touching shallow
   // terrain get this depth-colored, globally animated bank overlay.
   this.shallows=this.program(`attribute vec3 aPos;attribute float aDepth;varying vec3 vPos;varying float vDepth;${projection}void main(){vPos=aPos+uOffset;vDepth=aDepth;gl_Position=project(vPos);}`,`${tone}varying vec3 vPos;varying float vDepth;uniform vec3 uBase,uBank;uniform float uDusk;
    void main(){float depth=max(0.,vDepth);vec2 q=vPos.xz+uGlobal;float wet=1.-smoothstep(1.2,3.08,depth);if(wet<.002)discard;
      float tide=sin(q.x*.33+q.y*.23-uTime*.19*uMotion)*.065;
      float foam=(1.-smoothstep(.055,.25,abs(depth-.18-tide)))*smoothstep(-.25,.65,sin(q.y*.27+q.x*.19));
      vec3 shallow=mix(uBase,uBank,1.-smoothstep(.15,2.5,depth));vec3 color=mix(shallow,mix(uBank,vec3(.97,.97,.88),.63),foam*(.32-.24*uDusk));
      gl_FragColor=vec4(finish(color,vPos),wet*.78);}`);
   this.sprite=this.program(`attribute vec3 aPos;attribute vec2 aUV;attribute float aShift;varying vec2 vUV;varying vec3 vPos;varying float vShift;uniform float uVehicle,uAnchorDepth;${projection}void main(){vPos=aPos+uOffset;vUV=aUV;vShift=aShift;gl_Position=project(vPos);if(uVehicle>.5)gl_Position.z=uAnchorDepth;}`,`${tone}uniform sampler2D uAtlas;uniform float uCloudArt;uniform vec3 uCloudTint;varying vec2 vUV;varying vec3 vPos;varying float vShift;void main(){vec4 t=texture2D(uAtlas,vUV);if(t.a<.1)discard;vec3 c=t.rgb/max(t.a,.001);if(vShift>2.5){if(c.g>c.r*.97){float l=dot(c,vec3(.25,.6,.15));c=mix(vec3(.12,.25,.20),vec3(.43,.61,.34),smoothstep(.10,.78,l));}else{c*=vec3(.89,.96,.88);}}else if(vShift>1.5){float l=dot(c,vec3(.25,.6,.15));c=mix(c,vec3(.82,.62,.48)*(.48+l),.76);}else if(vShift>.5){float l=clamp((dot(c,vec3(.25,.6,.15))-.12)*2.1,0.,1.);c=mix(vec3(.10,.075,.20),vec3(.41,.30,.49),l);}if(uCloudArt>.5)c*=uCloudTint;gl_FragColor=vec4(finish(c,vPos)*t.a,t.a);}`);
   this.shadow=this.program(`attribute vec3 aPos;attribute vec2 aUV;varying vec2 vUV;${projection}void main(){vUV=aUV;gl_Position=project(aPos+uOffset);}`,`precision mediump float;varying vec2 vUV;void main(){float d=length((vUV-.5)*2.);if(d>1.)discard;gl_FragColor=vec4(.13,.16,.17,(1.-smoothstep(.25,1.,d))*.22);}`);
   this.atmo=this.program(`attribute vec3 aPos;attribute vec2 aUV;attribute float aKind,aAlpha;varying vec2 vUV;varying float vKind,vAlpha;${projection}void main(){vUV=aUV;vKind=aKind;vAlpha=aAlpha;gl_Position=project(aPos);}`,`precision mediump float;varying vec2 vUV;varying float vKind,vAlpha;uniform vec3 uFog,uCloudColor;uniform float uLight,uTime;
    float puff(vec2 c,vec2 r){vec2 p=(vUV-c)/r;return dot(p,p);}
    void main(){float d=min(puff(vec2(.48,.34),vec2(.47,.18)),min(puff(vec2(.38,.55),vec2(.22,.35)),puff(vec2(.66,.49),vec2(.23,.28))));float a=1.-smoothstep(.76,1.,d);vec3 color=mix(uCloudColor*.85,uCloudColor,smoothstep(.22,.75,vUV.y));if(vKind>.5){vec2 p=(vUV-.5)/vec2(.5,.47);a=pow(max(0.,1.-dot(p,p)),2.);a*=.80+.20*sin(vUV.x*19.+uTime*.07);color=mix(uFog,uCloudColor,.25);}a*=vAlpha;if(a<.003)discard;gl_FragColor=vec4(color*uLight,a);}`);
   this.cloudMesh=new FloatWriter(65536);this.cloudBuffer=gl.createBuffer();this.cloudWidthUniform=new Float32Array(MAX_CLOUDS*3);this.shadowStrength=.105;
   this.cloudUniform=new Float32Array(MAX_CLOUDS*3);this.clouds=[];this.atmoData=new FloatWriter(4096);this.atmoBuffer=gl.createBuffer();
   this.spriteBuffer=gl.createBuffer();this.shadowBuffer=gl.createBuffer();this.waterBuffer=gl.createBuffer();
   this.spriteData=new FloatWriter(8192);this.shadowData=new FloatWriter(8192);this.visibleFeatures=[];this.activeJob=null;this.jobSteps=0;this.drawnChunks=0;this.waterSize=0;
   this.carBuffer=gl.createBuffer();this.carData=new FloatWriter(32768);this.birdBuffer=gl.createBuffer();this.birdData=new FloatWriter(2048);this.cameraWorld=null;this.cameraClock=0;
   this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(.66,.78,.72,1);this.atlasW=atlas.width;this.atlasH=atlas.height;
   // Filter the atlas at the actual projected size; a single full-size sample
   // makes small moving cutouts shimmer. The padded atlas is power-of-two.
   gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   this.surfaceTextures={};const aniso=gl.getExtension('EXT_texture_filter_anisotropic');
   for(const [theme,image] of Object.entries(surface)){
     const tex=gl.createTexture();this.surfaceTextures[theme]=tex;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
     gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
     if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
   }
   for(const pass of [this.terrain,this.water]){gl.useProgram(pass.p);gl.uniform1i(gl.getUniformLocation(pass.p,'uSurface'),1);}gl.activeTexture(gl.TEXTURE0);this.resize();
 }
 program(vs,fs){const gl=this.gl,p=gl.createProgram();for(const [type,code] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return{p,uniforms:{},attrs:{}};}
 uniform(p,n,v){const gl=this.gl;if(!(n in p.uniforms))p.uniforms[n]=gl.getUniformLocation(p.p,n);const l=p.uniforms[n];if(l===null)return;if(Array.isArray(v)||ArrayBuffer.isView(v)){if(v.length%3===0)gl.uniform3fv(l,v);else gl.uniform2fv(l,v);}else gl.uniform1f(l,v);}
 use(p,offset=[0,0,0]){const gl=this.gl;gl.useProgram(p.p);this.uniform(p,'uOffset',offset);this.uniform(p,'uTarget',this.target);this.uniform(p,'uHalf',[this.halfW,this.halfH]);this.uniform(p,'uFog',this.fog);this.uniform(p,'uLight',this.light);this.uniform(p,'uTime',this.time);this.uniform(p,'uMotion',this.motion);this.uniform(p,'uGlobal',[this.origin[0],this.origin[2]]);this.uniform(p,'uClouds[0]',this.cloudUniform);this.uniform(p,'uCloudCount',this.clouds.length);this.uniform(p,'uCloudWidths[0]',this.cloudWidthUniform);this.uniform(p,'uShadowStrength',this.shadowStrength);this.uniform(p,'uShore',this.world.shore);this.uniform(p,'uHasWater',this.world.theme==='desert'?0:1);this.uniform(p,'uTheme',this.world.theme==='coast'?0:this.world.theme==='desert'?1:2);this.uniform(p,'uSurfacePhase',[((this.origin[0]%128)+128)%128,((this.origin[2]%128)+128)%128]);}
 attr(p,name,size,stride,offset){const gl=this.gl;if(!(name in p.attrs))p.attrs[name]=gl.getAttribLocation(p.p,name);const a=p.attrs[name];if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,stride*4,offset*4);}}
 buffer(data){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,ArrayBuffer.isView(data)?data:new Float32Array(data),gl.STATIC_DRAW);return b;}
 resize(){const rect=this.canvas.getBoundingClientRect(),ratio=clamp(rect.width/Math.max(rect.height,1),.25,4);let h=Math.max(320,Math.min(900,Math.round(rect.height)));h=Math.min(h,Math.floor(1600/ratio));this.canvas.height=h;this.canvas.width=Math.round(h*ratio);this.halfH=Math.max(this.artProfile.halfHeight,46/ratio);this.halfW=this.halfH*ratio;this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.lastKey=null;}
 reset(world){const gl=this.gl;for(const c of this.chunks.values()){gl.deleteBuffer(c.buf);if(c.bankBuf)gl.deleteBuffer(c.bankBuf);if(c.detailBuf)gl.deleteBuffer(c.detailBuf);}for(const c of this.roads.values())gl.deleteBuffer(c.buf);this.chunks.clear();this.roads.clear();this.queue=[];this.activeJob=null;this.visibleFeatures.length=0;this.world=world;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.surfaceTextures[world.theme]);gl.activeTexture(gl.TEXTURE0);this.lastKey=null;this.cameraWorld=null;this.loaded=0;this.fog=hex(world.p.fog);this.sky=hex(world.p.sky);this.waterColor=hex(world.p.water);}
 *makeChunk(cx,cz){const w=this.world,sz=64,res=32,step=2,verts=new FloatWriter(40000),samples=[];
    for(let i=Math.floor(cz*64/192)-2;i<=Math.floor((cz*64+64)/192)+2;i++)yield* w.prepareSite(i);
    for(let j=0;j<=res;j++){for(let i=0;i<=res;i++){const [x,z]=w.terrainVertex(cx*sz+i*step,cz*sz+j*step);const sample=w.sample(x,z,true);sample.x=x-cx*sz;sample.z=z-cz*sz;samples.push(sample);}yield;}
    const point=(i,j)=>{const ss=samples[j*(res+1)+i],p=[ss.x,ss.h,ss.z,...ss.color];p.n=ss.n;p.exposed=w.theme==='coast'?1-smooth(6,16,w.coastline(cz*sz+ss.z)-(cx*sz+ss.x)):0;return p;};
    const emit=tri=>{
      const [a,b,c]=tri,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;if(ny<0){nx=-nx;ny=-ny;nz=-nz;}
      const len=Math.hypot(nx,ny,nz),light=clamp((nx*-.58+ny*.75+nz*.32)/len),flat=.73+.32*light;
      // Fractured rock has planar faces; meadows retain their continuous normal.
      const faceLight=clamp(a.n[0]*-.58+a.n[1]*.75+a.n[2]*.32+b.n[0]*-.58+b.n[1]*.75+b.n[2]*.32+c.n[0]*-.58+c.n[1]*.75+c.n[2]*.32,0,3)/3;
      const rockPlane=.72+.32*Math.round(faceLight*6)/6;
      const facet=this.terrainDebug==='smooth'?0:.30*smooth(.10,.38,1-ny/len);
      for(const v of tri){const n=v.n,shade=.73+.32*clamp(n[0]*-.58+n[1]*.75+n[2]*.32),ratio=this.terrainDebug==='unlit'?1/shade:lerp(1,rockPlane/shade,facet);verts.push(v[0],v[1],v[2],v[3]*ratio,v[4]*ratio,v[5]*ratio,...v.n,v.exposed);}
    };
    for(let j=0;j<res;j++){for(let i=0;i<res;i++){
      // A global diagonal choice avoids rows of identically aligned rock faces.
      if(w.hash(cx*res+i,cz*res+j,334)<.5){emit([point(i,j),point(i+1,j),point(i,j+1)]);emit([point(i+1,j),point(i+1,j+1),point(i,j+1)]);}
      else{emit([point(i,j),point(i+1,j),point(i+1,j+1)]);emit([point(i,j),point(i+1,j+1),point(i,j+1)]);}
    }yield;}
    const bank=new FloatWriter(1024);
    if(w.theme!=='desert')for(let j=0;j<res;j++){
      for(let i=0;i<res;i++){
        const pts=[point(i,j),point(i+1,j),point(i,j+1),point(i+1,j+1)];
        if(!pts.some(p=>p[1]<.35)||!pts.some(p=>p[1]>-2.72))continue;
        for(const k of [0,1,2,1,3,2]){const p=pts[k];bank.push(p[0],.263,p[2],.25-p[1]);}
      }yield;
    }
    const details=yield* Renderer.prototype.makePlacePaths.call(this,cx,cz);yield;
    const features=yield* habitatFeatures(w,cx,cz);yield;
    return{cx,cz,x:cx*sz,z:cz*sz,buf:this.buffer(verts.view()),bytes:verts.length*4,count:verts.length/10,features,bankBuf:bank.length?this.buffer(bank.view()):null,bankCount:bank.length/4,bankBytes:bank.length*4,detailBuf:details.length?this.buffer(details.view()):null,detailCount:details.length/6,detailBytes:details.length*4};
 }

 *makePlacePaths(cx,cz){
   const w=this.world,out=new FloatWriter(2048),x0=cx*64,z0=cz*64;
   // Clip at cache bounds in world space. Never repeat a whole site in every
   // neighboring chunk; both sides share the exact clipped boundary.
   const clip=poly=>{
     for(const [axis,edge,sign]of [[0,x0,1],[0,x0+64,-1],[2,z0,1],[2,z0+64,-1]]){
       const next=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-edge)*sign,db=(b[axis]-edge)*sign;if(da>=0)next.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);next.push(a.map((v,k)=>lerp(v,b[k],t)));}}poly=next;
     }return poly;
   };
   const emit=tri=>{const p=clip(tri);for(let i=1;i<p.length-1;i++)for(const v of [p[0],p[i],p[i+1]])out.push(v[0]-x0,v[1],v[2]-z0,...v.slice(3));};
   const earth=hex(w.theme==='coast'?'#b9b18c':w.theme==='dusk'?'#7e788a':'#c4a383');
   for(const place of w.nearbySites(z0+32)){
     if(place.kind==='outcrop')continue;
     for(let j=0;j<2;j++){
       const a=place.path[j],b=place.path[j+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),steps=Math.ceil(len/1.1),nx=-dz/len,nz=dx/len;
       for(let k=0;k<steps;k++){
         const at=(t,o)=>{const x=lerp(a[0],b[0],t)+nx*o,z=lerp(a[1],b[1],t)+nz*o;return[x,w.height(x,z)+.12,z,...earth];};
         const p0=at(k/steps,-.95),p1=at(k/steps,.95),p2=at((k+1)/steps,-.95),p3=at((k+1)/steps,.95);
         emit([p0,p1,p2]);emit([p1,p3,p2]);yield;
       }
     }
   }
   if(w.theme==='coast'){
     const point=(x,z,color)=>{
       const s=w.sample(x,z),l=.90+.10*Math.max(0,s.n[0]*-.58+s.n[1]*.75+s.n[2]*.32);
       return[x,s.h+.10,z,...color.map(v=>v*l)];
     };
     const bed=(xy,heights,color)=>xy.map(([x,z],i)=>{const p=point(x,z,color);p[1]+=heights[i];return p;});
     for(const f of w.nearbyParcels(z0+32)){
       if(f.crop==='meadow'||f.x+f.rx+28<x0||f.x-f.rx-28>x0+64||f.z+f.rz+28<z0||f.z-f.rz-28>z0+64)continue;
       const c=SCENIC_COLORS[f.crop],color=hex(c.bed),half=f.crop==='grain'?1.8:1.8;
       for(let row=-Math.floor(f.rx/f.spacing);row<=Math.floor(f.rx/f.spacing);row++){
         const u=row*f.spacing,limit=f.rz*Math.pow(Math.max(0,.86-Math.pow(Math.abs(u)/f.rx,2.8)),1/2.8);
         const tint=.97+.06*w.hash(f.index,row,749),col=color.map(c=>c*tint),sideCol=col.map(c=>c*.91),top=f.crop==='grain'?.20:.32;
         for(let v=-limit;v<limit;v+=1.8){
           yield;const end=Math.min(v+1.8,limit),center=w.parcelPoint(f,parcelRowU(f,row,(v+end)*.5),(v+end)*.5),use=w.parcelUse(...center);
           if(!use||use.parcel.id!==f.id||use.weight<.82||w.siteExclusion(...center,2.0))continue;
           const wa=half*smooth(0,4,limit-Math.abs(v)),wb=half*smooth(0,4,limit-Math.abs(end));
           const ua=parcelRowU(f,row,v),ub=parcelRowU(f,row,end);
           const xy=[w.parcelPoint(f,ua-wa,v),w.parcelPoint(f,ua,v),w.parcelPoint(f,ua+wa,v),w.parcelPoint(f,ub-wb,end),w.parcelPoint(f,ub,end),w.parcelPoint(f,ub+wb,end)];
           if(xy.some(p=>w.siteExclusion(...p,.4)))continue;
           const h=[0,top*wa/half,0,0,top*wb/half,0],left=bed(xy,h,sideCol),right=bed(xy,h,col);
           emit([left[0],left[1],left[3]]);emit([left[1],left[4],left[3]]);
           emit([right[1],right[2],right[4]]);emit([right[2],right[5],right[4]]);
         }
       }
     }
     // A ground-conforming flower bed joins the source flowers into a mass.
     for(const n of w.nearbyScenery(z0+32))if(n.kind==='flower-fields'){
       for(let k=Math.ceil((z0-18-(n.z-108))/2);;k++){
         const z=n.z-108+k*2;if(z>Math.min(n.z+108,z0+82))break;if(z<n.z-108)continue;
         for(const side of [-1,1]){
           yield;const taper=smooth(0,9,108-Math.abs(z-n.z)),at=(zz,d)=>{const t=w.tangent(zz),a=side*d/Math.hypot(1,t);return[w.route(zz)+a,zz-a*t];};
           const xy=[at(z,8.05),at(z,8.05+2.65*taper),at(z+2,8.05),at(z+2,8.05+2.65*taper)];
           if(xy.some(p=>w.siteExclusion(...p,.6)||w.height(...p)<2))continue;
           const a=xy.map(p=>point(...p,hex('#c9c986')));emit([a[0],a[1],a[2]]);emit([a[1],a[3],a[2]]);
         }
       }
     }
   }return out;
 }

 *makeRoad(cz){const w=this.world,z0=cz*64,x0=Math.floor(w.route(z0)/64)*64,data=new FloatWriter(12000);
    for(let i=Math.floor(z0/192)-2;i<=Math.floor((z0+64)/192)+2;i++)yield* w.prepareSite(i);
    const point=(z,o,dy=.15)=>{const dx=w.tangent(z),f=1/Math.sqrt(1+dx*dx),x=w.route(z)+o*f,zz=z-o*dx*f;return[x-x0,w.height(x,zz)+dy,zz-z0];};
    const face=(a,b,c,col)=>data.push(...a,...col,...b,...col,...c,...col);
    const strip=(z1,z2,l,r,col,dy=.15)=>{let a=point(z1,l,dy),b=point(z1,r,dy),c=point(z2,l,dy),d=point(z2,r,dy);face(a,b,c,col);face(b,d,c,col);};
    const asphalt=hex(w.p.road),shoulder=mix3(w.rock,w.palette[0],.35),line=hex(w.p.line);
    const verge=(z,side,outer)=>{
      const width=1.15+1.4*w.noise(side*7,z*.08,581),o=side*(outer?5.4+width:4.85),p=point(z,o,.11);
      const col=outer?w.sample(p[0]+x0,p[2]+z0).color:mix3(shoulder,asphalt,.36);
      return [...p,...col];
    };
    for(let z=z0;z<z0+64;z+=1){
      strip(z,z+1,-4.85,4.85,asphalt);
      for(const side of [-1,1]){const a=verge(z,side,false),b=verge(z,side,true),c=verge(z+1,side,false),d=verge(z+1,side,true);data.push(...a,...b,...c,...b,...d,...c);}
      yield;
    }
    for(let z=Math.ceil(z0/8)*8;z<z0+64;z+=8){let end=Math.min(z+3.0,z0+64);for(let zz=z;zz<end;zz+=.5)strip(zz,Math.min(end,zz+.5),-.21,.21,line,.18);}
    // Do not drop a painted dash when the segment starts inside its global interval.
    const prev=Math.floor(z0/8)*8;if(prev<z0&&prev+3>z0)strip(z0,prev+3,-.21,.21,line,.18);
    return{x:x0,z:z0,buf:this.buffer(data.view()),bytes:data.length*4,count:data.length/6};
 }
 chunkVisible(cx,cz,margin=0){
    // Conservative projected bounds: all theme terrain and sprite tops fit -4..72.
    const dx=cx*64+32-this.origin[0]-this.target[0],dz=cz*64+32-this.origin[2]-this.target[2];
    const sx=dx*R[0]+dz*R[2],sy=dx*U[0]+dz*U[2]-this.target[1]*U[1];
    return Math.abs(sx)<this.halfW+46+margin&&sy-30<this.halfH+margin&&sy+86> -this.halfH-margin;
 }
 ensure(cx,cz,budget=3){const gl=this.gl,tx=this.origin[0]+this.target[0],tz=this.origin[2]+this.target[2],key=`${Math.floor(tx/16)}:${Math.floor(tz/16)}:${this.halfW}`;
    if(this.lastKey!==key){this.lastKey=key;this.radius=Math.ceil((this.halfW*.71+this.halfH*1.23+120)/64);const wanted=new Set(),roadWanted=new Set(),requiredRoads=new Set(),pending=[];
      for(let j=-this.radius;j<=this.radius;j++)for(let i=-this.radius;i<=this.radius;i++){
        const x=cx+i,z=cz+j,k=`${x}:${z}`;if(!this.chunkVisible(x,z,40))continue;
        wanted.add(k);roadWanted.add(z);const required=this.chunkVisible(x,z);if(required)requiredRoads.add(z);
        if(!this.chunks.has(k))pending.push({cx:x,cz:z,k,road:false,required,d:i*i+j*j});
      }
      for(const z of roadWanted)if(!this.roads.has(z))pending.push({cz:z,k:z,road:true,required:requiredRoads.has(z),d:(z-cz)**2-.5});
      if(this.activeJob){const c=this.activeJob.item;if((c.road?roadWanted:wanted).has(c.k)){const index=pending.findIndex(p=>p.road===c.road&&p.k===c.k);if(index>=0){c.required=pending[index].required;pending.splice(index,1);}}else this.activeJob=null;}
      pending.sort((a,b)=>Number(b.required)-Number(a.required)||a.d-b.d);this.queue=pending;
      for(const [k,c]of this.chunks)if(!wanted.has(k)){gl.deleteBuffer(c.buf);if(c.bankBuf)gl.deleteBuffer(c.bankBuf);if(c.detailBuf)gl.deleteBuffer(c.detailBuf);this.chunks.delete(k);}
      for(const [k,c]of this.roads)if(!roadWanted.has(k)){gl.deleteBuffer(c.buf);this.roads.delete(k);}
    }
    // Yield between terrain rows/road sections. Never build a whole chunk in a frame.
    const deadline=performance.now()+budget;this.jobSteps=0;
    do{if(!this.workStep())break;this.jobSteps++;}while(performance.now()<deadline&&this.jobSteps<512);
 }
 workStep(){
    if(!this.activeJob){const item=this.queue.shift();if(!item)return false;this.activeJob={item,iterator:item.road?this.makeRoad(item.cz):this.makeChunk(item.cx,item.cz)};}
    const job=this.activeJob,next=job.iterator.next();
    if(next.done){(job.item.road?this.roads:this.chunks).set(job.item.k,next.value);this.activeJob=null;this.loaded++;}
    return true;
 }
 get pending(){return this.queue.length+(this.activeJob?1:0);}
 get visiblePending(){return this.queue.reduce((n,j)=>n+Number(j.required),0)+Number(Boolean(this.activeJob?.item.required));}
 // Explicit diagnostic seeks only; normal animation always uses the time budget.
 fillAll(){while(this.workStep()){};}
 get bufferBytes(){let bytes=this.spriteData.gpuBytes+this.shadowData.gpuBytes+this.carData.gpuBytes+this.birdData.gpuBytes+this.cloudMesh.gpuBytes+this.atmoData.gpuBytes+72;for(const c of this.chunks.values())bytes+=c.bytes+(c.bankBytes||0)+(c.detailBytes||0);for(const c of this.roads.values())bytes+=c.bytes;return bytes;}
 billboard(out,f,time){const a=this.assets[f.id];if(!a)return;const [ax,ay,aw,ah]=a.rect,w=f.w,h=w*ah/aw,anchor=a.anchor||[.5,.96];
    const x=f.x-this.origin[0],y=f.y+.045+(f.id==='sailboat'?.06*Math.sin(time*.35+f.z)*this.motion:0),z=f.z-this.origin[2];
    const pt=(u,v)=>{const flex=f.groundcover?.035*w*this.motion*Math.sin(time*1.35+f.x*.13+f.z*.11)*(v-(1-anchor[1])):0;const xx=(u-anchor[0])*w+flex,yy=(v-(1-anchor[1]))*h;return[x+R[0]*xx,y+yy/U[1],z+R[2]*xx,(ax+u*aw)/this.atlasW,(ay+(1-v)*ah)/this.atlasH,(f.shift??((f.category==='tree'||f.category==='shrub')&&this.world.theme==='coast'?3:0))];};
    const a0=pt(0,0),b=pt(1,0),c=pt(0,1),d=pt(1,1);out.push(...a0,...b,...c,...b,...d,...c);
 }
 visible(f){const d=[f.x-this.origin[0]-this.target[0],f.y-this.target[1],f.z-this.origin[2]-this.target[2]],sx=d[0]*R[0]+d[2]*R[2],sy=d[0]*U[0]+d[1]*U[1]+d[2]*U[2];return Math.abs(sx)<this.halfW+18&&sy> -this.halfH-20&&sy<this.halfH+8;}
 render(state){const w=this.world,gl=this.gl,z=state.distance,v=state.vehicle;const carX=v.x,carZ=v.z,carY=v.y;
    const desiredZ=z-this.artProfile.lookAhead,desired=[w.route(desiredZ)+(w.theme==='coast'?22:w.theme==='dusk'?12:0),w.roadHeight(desiredZ)+.8,desiredZ],dt=clamp(state.clock-this.cameraClock,0,.1);this.cameraClock=state.clock;
    if(!this.cameraWorld||Math.abs(desiredZ-this.cameraWorld[2])>32)this.cameraWorld=desired;
    else if(dt>0){const follow=1-Math.exp(-dt*4);for(let i=0;i<3;i++)this.cameraWorld[i]=lerp(this.cameraWorld[i],desired[i],follow);}
    const [tx,ty,tz]=this.cameraWorld;this.motion=state.calm?0:1;
    this.origin=[Math.floor(tx/64)*64,0,Math.floor(tz/64)*64];this.target=[tx-this.origin[0],ty,tz-this.origin[2]];
    this.time=state.clock;const sun=Math.sin((state.hour-6)/24*Math.PI*2);this.light=clamp(.94+.12*sun,.75,1.06);if(w.theme==='dusk')this.light=Math.max(.94,this.light);
    this.prepareAtmosphere(state);
    this.ensure(Math.floor(tx/64),Math.floor(tz/64),state.loading?24:3);if(state.loading&&this.visiblePending)return;gl.clearColor(...this.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);gl.depthMask(true);
    this.use(this.terrain);this.drawnChunks=0;
    for(const c of this.chunks.values()){if(!this.chunkVisible(c.cx,c.cz))continue;this.drawnChunks++;this.uniform(this.terrain,'uOffset',[c.x-this.origin[0],0,c.z-this.origin[2]]);gl.bindBuffer(gl.ARRAY_BUFFER,c.buf);this.attr(this.terrain,'aPos',3,10,0);this.attr(this.terrain,'aColor',3,10,3);this.attr(this.terrain,'aNormal',4,10,6);gl.drawArrays(gl.TRIANGLES,0,c.count);}
    if(w.theme!=='desert'){
      this.use(this.water);this.uniform(this.water,'uGlobal',[this.origin[0],this.origin[2]]);this.uniform(this.water,'uBase',this.waterColor);this.uniform(this.water,'uNight',w.theme==='dusk'?1:0);
      const s=64*(this.radius+2);gl.bindBuffer(gl.ARRAY_BUFFER,this.waterBuffer);if(this.waterSize!==s){this.waterSize=s;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-s,.25,-s,s,.25,-s,-s,.25,s,s,.25,-s,s,.25,s,-s,.25,s]),gl.STATIC_DRAW);}this.attr(this.water,'aPos',3,3,0);gl.drawArrays(gl.TRIANGLES,0,6);
    }
    if(w.theme!=='desert'){
      this.use(this.shallows);this.uniform(this.shallows,'uBase',this.waterColor);this.uniform(this.shallows,'uBank',hex(w.theme==='coast'?'#98c4b7':'#a394b8'));this.uniform(this.shallows,'uDusk',w.theme==='dusk'?1:0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      for(const c of this.chunks.values()){if(!c.bankBuf||!this.chunkVisible(c.cx,c.cz))continue;this.uniform(this.shallows,'uOffset',[c.x-this.origin[0],0,c.z-this.origin[2]]);gl.bindBuffer(gl.ARRAY_BUFFER,c.bankBuf);this.attr(this.shallows,'aPos',3,4,0);this.attr(this.shallows,'aDepth',1,4,3);gl.drawArrays(gl.TRIANGLES,0,c.bankCount);}
      gl.depthMask(true);gl.disable(gl.BLEND);
    }
    this.use(this.land);for(const c of this.roads.values()){this.uniform(this.land,'uOffset',[c.x-this.origin[0],0,c.z-this.origin[2]]);gl.bindBuffer(gl.ARRAY_BUFFER,c.buf);this.attr(this.land,'aPos',3,6,0);this.attr(this.land,'aColor',3,6,3);gl.drawArrays(gl.TRIANGLES,0,c.count);}
    this.use(this.land);for(const c of this.chunks.values()){if(!c.detailBuf||!this.chunkVisible(c.cx,c.cz))continue;this.uniform(this.land,'uOffset',[c.x-this.origin[0],0,c.z-this.origin[2]]);gl.bindBuffer(gl.ARRAY_BUFFER,c.detailBuf);this.attr(this.land,'aPos',3,6,0);this.attr(this.land,'aColor',3,6,3);gl.drawArrays(gl.TRIANGLES,0,c.detailCount);}
    const sprites=this.spriteData,features=this.visibleFeatures;sprites.length=0;features.length=0;for(const c of this.chunks.values())for(const f of c.features)if(this.visible(f))features.push(f);
    const angle=Math.atan2((Math.cos(v.yaw)-Math.sin(v.yaw))*.57735,Math.sin(v.yaw)+Math.cos(v.yaw))-Math.PI/6;
    const car={id:w.p.car,x:carX,z:carZ,y:carY,w:6.8,angle,yaw:v.yaw,steering:v.steering,contacts:v.contacts,key:'player',model:'authored-micro-wagon'};features.push(car);
    // Each footprint samples local terrain, so shadows do not float on slopes.
    const shadows=this.shadowData;shadows.length=0;
    for(const f of features){if(f.boat||f.groundcover||f.id==='flowers'||f.id.startsWith('orange-'))continue;
      const vehicle=f===car,ww=vehicle?1.82:f.w*(f.id.startsWith('pine')?.31:.40),ll=vehicle?3.20:f.w*.22;
      const cs=vehicle?Math.cos(v.yaw):1,sn=vehicle?Math.sin(v.yaw):0;
      const footprint=(!vehicle&&f.groundShadow)||[[-ww,-ll,0,0],[ww,-ll,1,0],[-ww,ll,0,1],[ww,ll,1,1]].map(([x,z,u,q])=>{const xx=f.x+x*cs-z*sn,zz=f.z+x*sn+z*cs;const onRoad=Math.abs(xx-w.route(zz))/Math.hypot(1,w.tangent(zz))<5.4;return[xx,w.height(xx,zz)+(onRoad?.205:.065),zz,u,q];});
      if(!vehicle)f.groundShadow=footprint;
      const pts=footprint.map(p=>[p[0]-this.origin[0],p[1],p[2]-this.origin[2],p[3],p[4]]);
      shadows.push(...pts[0],...pts[1],...pts[2],...pts[1],...pts[3],...pts[2]);
    }
    this.use(this.shadow);shadows.upload(gl,this.shadowBuffer);this.attr(this.shadow,'aPos',3,5,0);this.attr(this.shadow,'aUV',2,5,3);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,shadows.length/5);gl.depthMask(true);gl.disable(gl.BLEND);
    // The car is ordinary depth-tested 3D geometry, not an ALWAYS overlay.
    this.carData.length=0;vehicleGeometry(this.carData,v,w.theme,this.origin);this.use(this.land);this.carData.upload(gl,this.carBuffer);this.attr(this.land,'aPos',3,6,0);this.attr(this.land,'aColor',3,6,3);gl.drawArrays(gl.TRIANGLES,0,this.carData.length/6);
    this.use(this.sprite);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);this.uniform(this.sprite,'uVehicle',0);this.uniform(this.sprite,'uCloudArt',0);
    // Transparent cutout edges need far-to-near order; opaque texels still use depth.
    features.sort((a,b)=>(a.x-b.x)*F[0]+(a.y-b.y)*F[1]+(a.z-b.z)*F[2]);
    for(const f of features)if(f!==car)this.billboard(sprites,f,state.clock);
    sprites.upload(gl,this.spriteBuffer);this.attr(this.sprite,'aPos',3,6,0);this.attr(this.sprite,'aUV',2,6,3);this.attr(this.sprite,'aShift',1,6,5);gl.drawArrays(gl.TRIANGLES,0,sprites.length/6);gl.disable(gl.BLEND);
    this.drawBirds(state);this.drawAtmosphere(state);
    this.totalFrames++;this.visibleProps=features.length;this.player=car;
 }
 prepareAtmosphere(state){
   const w=this.world,time=state.calm?0:state.clock,[tx,ty,tz]=this.cameraWorld;
   const candidates=[],cell=126,windX=time*.52,windZ=time*.21;
   const bx=Math.floor((tx-windX)/cell),bz=Math.floor((tz-windZ)/cell);
   const overlaps=(x,y,z,margin)=>{const sx=(x-tx)*R[0]+(z-tz)*R[2],sy=(x-tx)*U[0]+(z-tz)*U[2]+(y-ty)*U[1];return Math.abs(sx)<this.halfW+margin&&Math.abs(sy)<this.halfH+margin;};
   for(let iz=bz-3;iz<=bz+3;iz++)for(let ix=bx-3;ix<=bx+3;ix++){
     const x=(ix+.2+.6*w.hash(ix,iz,151))*cell+windX,z=(iz+.2+.6*w.hash(ix,iz,152))*cell+windZ;
     const y=72+12*w.hash(ix,iz,153),width=10+5*w.hash(ix,iz,154),pool=HABITAT_RULES[w.theme].clouds,type=pool[Math.floor(w.hash(ix,iz,155)*pool.length)];
     // Culling retains offscreen casters whose projected shadow is visible.
     let needed=overlaps(x,y,z,width);
     for(const receiverY of [0,32,64])needed ||= overlaps(x-SUN[0]/SUN[1]*(y-receiverY),receiverY,z-SUN[2]/SUN[1]*(y-receiverY),width);
     if(needed)candidates.push({x,y,z,w:width,type,key:`cloud:${ix}:${iz}`,dist:Math.hypot(x-tx,z-tz)});
   }
   candidates.sort((a,b)=>a.dist-b.dist);this.cloudCandidates=candidates.length;this.clouds=candidates.slice(0,MAX_CLOUDS);
   this.cloudUniform.fill(0);this.cloudWidthUniform.fill(0);
   for(let i=0;i<this.clouds.length;i++){const c=this.clouds[i];this.cloudUniform.set([c.x-this.origin[0],c.y,c.z-this.origin[2]],i*3);this.cloudWidthUniform[i*3]=c.w;this.cloudWidthUniform[i*3+1]=c.type;}
   this.atmosphereTime=time;
 }
 drawClouds(){
   const out=this.cloudMesh,gl=this.gl;out.length=0;this.visibleClouds=0;
   for(const c of this.clouds){
     const f={id:c.type===0||c.type===4?'cloud-wisp':'cloud-bank',x:c.x,y:c.y,z:c.z,w:c.w*1.6,shift:0};
     if(!this.visible(f))continue;this.visibleClouds++;this.billboard(out,f,0);
   }
   if(!out.length)return;
   this.use(this.sprite);this.uniform(this.sprite,'uVehicle',0);this.uniform(this.sprite,'uCloudArt',1);
   this.uniform(this.sprite,'uCloudTint',this.world.theme==='dusk'?[.78,.66,.92]:[1,1.02,1.04]);
   gl.bindTexture(gl.TEXTURE_2D,this.tex);out.upload(gl,this.cloudBuffer);this.attr(this.sprite,'aPos',3,6,0);this.attr(this.sprite,'aUV',2,6,3);this.attr(this.sprite,'aShift',1,6,5);
   gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,out.length/6);gl.depthMask(true);gl.disable(gl.BLEND);
   this.uniform(this.sprite,'uCloudArt',0);
 }
 drawAtmosphere(state){
   const out=this.atmoData,w=this.world,gl=this.gl,patches=[];out.length=0;
   this.drawClouds();
   const cell=Math.floor(state.distance/100),time=this.atmosphereTime;
   for(let i=cell-2;i<=cell+2;i++){
     const z=i*100+27+Math.sin(time*.025+w.hash(i,0,161)*6.28)*12;
     const x=w.theme==='desert'?w.route(z)-45:w.edge(z)+(w.theme==='coast'?12:5);
     const y=w.theme==='desert'?w.height(x,z)+3:2.9+w.hash(i,0,163)*2;
     patches.push({x,y,z,w:32+w.hash(i,0,164)*21,h:4.2,kind:1,alpha:w.theme==='dusk'?.21:w.theme==='coast'?.12:.065});
   }
   patches.sort((a,b)=>(a.x-b.x)*F[0]+(a.y-b.y)*F[1]+(a.z-b.z)*F[2]);this.mistPatches=0;
   for(const f of patches){
     const dx=f.x-this.origin[0]-this.target[0],dz=f.z-this.origin[2]-this.target[2];
     const sx=dx*R[0]+dz*R[2],sy=dx*U[0]+dz*U[2]+(f.y-this.target[1])*U[1];
     if(Math.abs(sx)>this.halfW+f.w*.5||Math.abs(sy)>this.halfH+f.h)continue;
     if(f.kind===0)this.visibleClouds++;else this.mistPatches++;
     const pt=(u,v)=>{const xx=(u-.5)*f.w,yy=(v-.5)*f.h;return[f.x-this.origin[0]+xx*R[0],f.y+yy/U[1],f.z-this.origin[2]+xx*R[2],u,v,f.kind,f.alpha];};
     const a=pt(0,0),b=pt(1,0),c=pt(0,1),d=pt(1,1);out.push(...a,...b,...c,...b,...d,...c);
   }
   if(!out.length)return;
   this.use(this.atmo);this.uniform(this.atmo,'uCloudColor',w.theme==='dusk'?hex('#d4b4d1'):w.theme==='desert'?hex('#ffebc5'):hex('#eef0dd'));
   this.uniform(this.atmo,'uTime',time);out.upload(gl,this.atmoBuffer);this.attr(this.atmo,'aPos',3,7,0);this.attr(this.atmo,'aUV',2,7,3);this.attr(this.atmo,'aKind',1,7,5);this.attr(this.atmo,'aAlpha',1,7,6);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,out.length/7);gl.depthMask(true);gl.disable(gl.BLEND);
 }
 drawBirds(state){
   const out=this.birdData,w=this.world,gl=this.gl;out.length=0;this.birds=0;if(state.calm)return;
   const cell=Math.floor(state.distance/120),col=w.theme==='dusk'?hex('#c6b9d0'):w.theme==='desert'?hex('#655a4a'):hex('#f2efdc');
   for(let band=cell-1;band<=cell+1;band++){
     const phase=w.hash(band,0,103)*Math.PI*2,t=state.clock*.057+phase;
     const baseZ=band*120+40+Math.sin(t)*28,baseX=w.route(baseZ)+Math.cos(t)*35;
     const fx=-Math.sin(t),fz=Math.cos(t),rx=fz,rz=-fx;
     for(let i=0;i<4;i++){
       const x=baseX+rx*(i-1.5)*3-fx*i*2,z=baseZ+rz*(i-1.5)*3-fz*i*2,y=30+w.hash(band,i,104)*5;
       if(!this.visible({x,y,z}))continue;
       const flap=Math.sin(state.clock*4.1+phase+i*.53)*.65*(Math.sin(state.clock*.65+phase)>.1?1:.12);
       const point=(a,b,c)=>[x-this.origin[0]+rx*a+fx*c,y+b,z-this.origin[2]+rz*a+fz*c,...col];
       const tri=(a,b,c)=>out.push(...point(...a),...point(...b),...point(...c));
       tri([0,0,.57],[-.16,0,-.27],[.16,0,-.27]);
       for(const side of [-1,1]){tri([0,0,.24],[side*.68,flap*.55,.03],[side*1.36,flap,-.26]);tri([0,0,.24],[side*1.36,flap,-.26],[side*.46,flap*.4,-.34]);}
       this.birds++;
     }
   }
   if(!out.length)return;this.use(this.land);out.upload(gl,this.birdBuffer);this.attr(this.land,'aPos',3,6,0);this.attr(this.land,'aColor',3,6,3);gl.drawArrays(gl.TRIANGLES,0,out.length/6);
 }
}

// Original synthesized ambience; no recordings or music samples. CC0-1.0;
// see AUDIO-LICENSE.txt. Generation yields so enabling sound cannot freeze a trip.
async function createNatureLoop(context,theme,valid=()=>true){
 const rate=24000,seconds=18,length=rate*seconds,buffer=context.createBuffer(1,length,rate),data=buffer.getChannelData(0);let noise=0,random=137;
 for(let start=0;start<length;start+=8192){if(!valid())return null;
   for(let i=start;i<Math.min(length,start+8192);i++){
     random=(Math.imul(random,1664525)+1013904223)>>>0;noise=.96*noise+.04*(random/2147483648-1);
     const t=i/rate,wave=.5+.5*Math.sin(t*Math.PI*2/9),wind=.7+.3*Math.sin(t*Math.PI*2/18);
     let value=noise*(theme==='coast'?.6+.7*wave:theme==='desert'?.65*wind:.35);
     if(theme==='coast'){const p=t%5.7-.8;if(p>0&&p<.55)value+=.024*Math.sin(Math.PI*p/.55)**2*Math.sin(2*Math.PI*(1600*p+650*p*p));}
     if(theme==='dusk'){const p=t%3.6;if(p<.65)value+=.007*Math.sin(Math.PI*p/.65)**2*(.5+.5*Math.sin(t*2*Math.PI*18))*Math.sin(t*2*Math.PI*2800);}
     data[i]=value;
   }
   await new Promise(resolve=>setTimeout(resolve,0));
 }
 const overlap=rate/4;for(let i=0;i<overlap;i++){const t=i/(overlap-1);data[length-overlap+i]=lerp(data[length-overlap+i],data[i],t*t*(3-2*t));}
 return {buffer,loopStart:overlap/rate,loopEnd:seconds};
}
class NatureSound{
 constructor(){this.context=null;this.enabled=false;this.version=0;this.theme=null;this.sources=new Set();}
 async select(theme){this.requestedTheme=theme;if(!this.enabled)return;const version=++this.version,context=this.context;if(this.theme===theme&&[...this.sources].some(s=>!s.retiring)){for(const s of this.sources)if(!s.retiring)s.gain.gain.setTargetAtTime(.6,context.currentTime,.12);return;}
   const loop=await createNatureLoop(context,theme,()=>version===this.version&&this.enabled);if(!loop)return;
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=loop.buffer;source.loop=true;source.loopStart=loop.loopStart;source.loopEnd=loop.loopEnd;
   source.connect(gain);gain.connect(context.destination);gain.gain.value=0;gain.gain.linearRampToValueAtTime(.6,context.currentTime+.5);
   for(const previous of this.sources){if(previous.retiring)continue;previous.retiring=true;previous.gain.gain.cancelScheduledValues(context.currentTime);previous.gain.gain.setTargetAtTime(0,context.currentTime,.10);previous.source.stop(context.currentTime+.5);}
   const entry={source,gain};this.sources.add(entry);source.onended=()=>{source.disconnect();gain.disconnect();this.sources.delete(entry);};source.start(0,loop.loopStart);this.theme=theme;
 }
 async toggle(theme){this.enabled=!this.enabled;this.requestedTheme=theme;
   if(this.enabled){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){this.enabled=false;throw Error('Audio is unavailable in this browser');}if(!this.context)this.context=new AC();await this.context.resume();if(this.enabled)await this.select(this.requestedTheme);}
   else {this.version++;if(this.context){for(const s of this.sources)s.gain.gain.setTargetAtTime(0,this.context.currentTime,.08);await new Promise(resolve=>setTimeout(resolve,300));if(!this.enabled)await this.context.suspend();}}
 }
 visibility(hidden){if(!this.context)return;if(hidden)this.context.suspend();else if(this.enabled)this.context.resume();}
}

(async()=>{
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('landscape'),query=new URLSearchParams(location.hash.slice(1));
 const validTheme=query.get('theme')in THEMES?query.get('theme'):'coast';let seed=query.has('seed')&&/^\d{1,10}$/.test(query.get('seed'))&&Number(query.get('seed'))<=4294967295?Number(query.get('seed')):1307;
 const startZ=query.has('z')&&Number.isFinite(Number(query.get('z')))?Number(query.get('z')):80;
 const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
 let world=new World(seed,validTheme);const state={distance:startZ,start:startZ,travelled:0,clock:0,hour:THEMES[validTheme].time,speed:32,targetSpeed:32,lane:-1.5,steerLane:-1.5,paused:motionPreference.matches,auto:true,loading:true,calm:motionPreference.matches};
 state.vehicle=new Vehicle(world,startZ);
 const sound=new NatureSound();let renderer,ready=false,keyState=new Set(),last=0,uiAt=0,toastTimer=null,dirty=true,contextLost=false;
 const hh=t=>{let m=Math.round(t*60)%1440;return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`};
 function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1900)}
 function sync(){
   $('sceneLabel').textContent=world.p.name.toUpperCase();$('distance').textContent=(state.travelled/1000).toFixed(2);$('tripMeta').textContent=`SEED ${world.seed} · ${hh(state.hour)}`;
   $('speed').textContent=Math.round(state.paused?0:state.speed);$('modeLabel').textContent=state.paused?'TAKE A BREATH':state.auto?'AUTO DRIVE':'MANUAL DRIVE';$('mode').textContent=state.auto?'Auto':'Drive';$('mode').setAttribute('aria-label',state.auto?'Switch to assisted manual driving':'Switch to automatic driving');$('play').textContent=state.paused?'▶':'Ⅱ';$('play').classList.toggle('paused',state.paused);$('play').setAttribute('aria-label',state.paused?'Resume':'Pause');$('hourText').textContent=hh(state.hour);
 }
 function saveURL(){try{history.replaceState(null,'',`#theme=${world.theme}&seed=${world.seed}&z=${state.distance.toFixed(1)}`)}catch{}}
 function choose(theme,newSeed=world.seed){
   if(!(theme in THEMES)||contextLost)return;
   if(ready&&!document.documentElement.classList.contains('ambient-embedded')){renderer.render(state);const frozen=$('transitionFrame');frozen.width=canvas.width;frozen.height=canvas.height;frozen.getContext('2d').drawImage(canvas,0,0);frozen.style.visibility='visible';$('loading').classList.add('frozen');}
   ready=false;state.loading=true;window.__wander.ready=false;keyState.clear();$('loading').classList.remove('done');document.querySelectorAll('.ui').forEach(el=>el.inert=true);dirty=true;last=0;
   seed=Number(newSeed)>>>0;world=new World(seed,theme);renderer.reset(world);state.distance=80;state.start=80;state.travelled=0;state.hour=world.p.time;state.clock=0;state.lane=state.steerLane=-1.5;state.vehicle.reset(world,80);$('hour').value=state.hour;$('seed').value=world.seed;document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('selected',b.dataset.theme===theme));saveURL();sound.select(theme).catch(e=>toast(e.message));
 }
 function pause(){state.paused=!state.paused;sync();saveURL()}
 function mode(auto=!state.auto){state.auto=auto;sync()}
 function speed(delta){state.targetSpeed=clamp(state.targetSpeed+delta,0,90);if(state.paused&&delta>0)state.paused=false;sync()}
 async function photo(){if(!ready||contextLost)return;renderer.render(state);canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`wander-${world.theme}-${world.seed}-${Math.round(state.distance)}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Photo saved from the live renderer')},'image/png')}
 function toggleMenu(force){const open=force??$('settings').hidden;$('settings').hidden=!open;$('menu').setAttribute('aria-expanded',String(open));}
 function toggleAudio(){const task=sound.toggle(world.theme);$('audio').textContent=sound.enabled?'On':'Off';$('audio').setAttribute('aria-pressed',String(sound.enabled));task.catch(e=>{sound.enabled=false;$('audio').textContent='Off';$('audio').setAttribute('aria-pressed','false');toast(e.message);});}
 try{
   const art=await prepareArt();renderer=new Renderer(canvas,art.atlas,art.manifest,art.surface);renderer.reset(world);
   $('seed').value=seed;$('hour').value=state.hour;document.querySelectorAll('[data-theme]').forEach(b=>{b.classList.toggle('selected',b.dataset.theme===validTheme);b.onclick=()=>choose(b.dataset.theme)});
   $('play').onclick=pause;$('mode').onclick=()=>mode();$('slower').onclick=()=>speed(-8);$('faster').onclick=()=>speed(8);$('photo').onclick=photo;$('menu').onclick=()=>toggleMenu();$('closeMenu').onclick=()=>toggleMenu(false);$('audio').onclick=toggleAudio;
   $('settings').querySelector('.help').insertAdjacentHTML('beforebegin','<div class="label-row"><span>Less motion</span><button id="calm" class="text-button" aria-pressed="false">Off</button></div>');
   const syncCalm=()=>{$('calm').textContent=state.calm?'On':'Off';$('calm').setAttribute('aria-pressed',String(state.calm));dirty=true;};$('calm').onclick=()=>{state.calm=!state.calm;syncCalm();};motionPreference.addEventListener('change',e=>{state.calm=e.matches;syncCalm();});syncCalm();
   $('hour').oninput=()=>{state.hour=Number($('hour').value);dirty=true;sync()};$('seedForm').onsubmit=e=>{e.preventDefault();if(!/^\d{1,10}$/.test($('seed').value)||Number($('seed').value)>4294967295){toast('Enter a number from 0 to 4294967295');return}choose(world.theme,Number($('seed').value))};$('shuffle').onclick=()=>{let s=new Uint32Array(1);crypto.getRandomValues(s);choose(world.theme,s[0])};
   const ignore=e=>/INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
   window.addEventListener('keydown',e=>{if(ignore(e))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keyState.add(e.key.toLowerCase());if(e.repeat)return;switch(e.key.toLowerCase()){case' ':pause();break;case'a':mode();break;case'h':document.body.classList.toggle('hide-ui');break;case'p':photo();break;case'escape':toggleMenu(false);break;case'arrowleft':case'arrowright':case'arrowup':case'arrowdown':case'w':case's':mode(false);break;}});
   window.addEventListener('keyup',e=>keyState.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keyState.clear());document.addEventListener('visibilitychange',()=>{last=0;dirty=true;if(document.hidden)keyState.clear();sound.visibility(document.hidden);});
   for(const [id,key]of [['steerLeft','arrowleft'],['steerRight','arrowright']]){$(id).onpointerdown=e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId);mode(false);keyState.add(key)};$(id).onpointerup=$(id).onpointercancel=()=>keyState.delete(key);}
   let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{renderer.resize();dirty=true;},80)});
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;ready=false;window.__wander.ready=false;state.paused=true;$('loading').classList.remove('done');$('loading').innerHTML='<p>Graphics context was lost. Reload this page to resume.</p>'});
   function advance(dt){
     if(state.paused)return;
     if(!state.auto){if(keyState.has('arrowup')||keyState.has('w'))state.targetSpeed=clamp(state.targetSpeed+23*dt,0,90);if(keyState.has('arrowdown')||keyState.has('s'))state.targetSpeed=clamp(state.targetSpeed-36*dt,0,90);}
     const steer=(keyState.has('arrowright')?1:0)-(keyState.has('arrowleft')?1:0);
     state.vehicle.step(world,state,dt,steer);state.clock+=dt;state.hour=(state.hour+dt*.00065)%24;
   }
   function loop(t){if(contextLost)return;if(document.hidden){last=0;requestAnimationFrame(loop);return;}const dt=Math.min((t-(last||t))/1000,.055);last=t;if(ready)advance(dt);
     if(!ready||!state.paused||dirty||renderer.pending){renderer.render(state);dirty=false;}
     if(!ready&&renderer.visiblePending===0){ready=true;state.loading=false;window.__wander.ready=true;last=t;$('transitionFrame').style.visibility='hidden';$('loading').classList.add('done');document.querySelectorAll('.ui').forEach(el=>el.inert=false);sync();setTimeout(()=>$('hint').style.opacity='0',6500)}
     if(t-uiAt>100&&ready&&!state.paused){sync();uiAt=t}requestAnimationFrame(loop)}
   window.__wander={ready:false,state,
     player:Object.freeze({randomScene(){const r=new Uint32Array(2);crypto.getRandomValues(r);const keys=Object.keys(THEMES).filter(theme=>theme!==world.theme);choose(keys[r[0]%keys.length],r[1]);},nextScene(){const keys=Object.keys(THEMES);choose(keys[(keys.indexOf(world.theme)+1)%keys.length]);},previousScene(){const keys=Object.keys(THEMES);choose(keys[(keys.indexOf(world.theme)+keys.length-1)%keys.length]);},setPlaying(value){if(state.paused===Boolean(value))pause();return !state.paused;},drawTo(target){if(!ready)return false;renderer.render(state);target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0);return true;}}),get world(){return world},get renderer(){return renderer},setTheme:choose,
     seek(z){if(typeof z!=='number'||!Number.isFinite(z)||Math.abs(z)>1000000)throw RangeError('Seek must be finite and within one million world units.');state.paused=true;state.distance=z;state.vehicle.reset(world,z);state.lane=state.steerLane=-1.5;renderer.cameraWorld=null;renderer.render(state);renderer.fillAll();renderer.render(state);sync()},
     step(seconds){if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0||seconds>600)throw RangeError('Step must be between 0 and 600 seconds.');let paused=state.paused;state.paused=false;for(let t=0;t<seconds;t+=1/60)advance(Math.min(1/60,seconds-t));state.paused=paused;renderer.render(state);renderer.fillAll();renderer.render(state);sync()},
     resetClock(){state.clock=0;state.hour=world.p.time;renderer.render(state)},
     author:Object.freeze({
       frame(input={}){const next={...renderer.artProfile,...input};for(const [k,min,max]of [['halfHeight',36,60],['lookAhead',10,40]])if(typeof next[k]!=='number'||!Number.isFinite(next[k])||next[k]<min||next[k]>max)throw RangeError('Invalid author framing: '+k);renderer.artProfile={halfHeight:next.halfHeight,lookAhead:next.lookAhead};renderer.resize();renderer.cameraWorld=null;renderer.render(state);renderer.fillAll();renderer.render(state);return {...renderer.artProfile};},
       capture(){renderer.render(state);return canvas.toDataURL('image/png');}
     }),
     metadata(){return{seed:world.seed,theme:world.theme,distance:state.distance,travelled:state.travelled,clock:state.clock,hour:state.hour,frame:renderer.totalFrames,projection:'orthographic-isometric',camera:{azimuth:CAMERA_AZIMUTH,elevation:CAMERA_ELEVATION,...renderer.artProfile,effectiveHalfHeight:renderer.halfH},renderSize:[canvas.width,canvas.height],chunks:renderer.chunks.size,drawnChunks:renderer.drawnChunks,pending:renderer.pending,visiblePending:renderer.visiblePending,bufferBytes:renderer.bufferBytes,props:renderer.visibleProps,player:renderer.player,birds:renderer.birds,clouds:renderer.visibleClouds,mist:renderer.mistPatches,assetTypes:Object.keys(renderer.assets).length,terrainRevision:world.theme==='coast'?'reference-coastal-shelves-1':'continuous-geology-2',assetRevision:'reference-cutout-families-1',visualRevision:'reference-restoration-1',scenicReach:world.theme==='coast'?world.sceneryFrame(state.distance).kind:null,sceneryCache:world.sceneryCache?.size||0,parcelCache:world.parcelCache?.size||0,scenicFrameCache:world.frameCache?.size||0,siteCache:world.siteCache?.size||0,cloudFamilies:CLOUD_FAMILIES.length,cloudCasters:renderer.clouds.length,cloudCandidates:renderer.cloudCandidates,renderer:'actual WebGL canvas',glError:renderer.gl.getError()}}};
   sync();requestAnimationFrame(loop);
 }catch(error){console.error(error);$('loading').innerHTML='<div style="max-width:350px;padding:30px;color:#354a3f"><h2>Could not start the landscape</h2><p></p><button onclick="location.reload()">Try again</button></div>';$('loading').querySelector('p').textContent=error.message;}
})();
