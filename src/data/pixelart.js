"use strict";
/* =========================================================
   BITXO — data/pixelart: arte de píxeles de bitxos, objetos e iconos
   ========================================================= */
/* Formato: {pal, rows, blink:[[fila, filaConOjosCerrados],...]} */
const EGG_ROWS = [
"....kkkk....","..kkwwwwkk..",".kwwwwwwwwk.",".kwwgwwwgwk.","kwwwwwwwwwwk","kwwgwwwwgwwk","kwwwwggwwwwk","kwwwwwwwwwwk","kwgwwwwwwgwk",".kwwwwwwwwk.",".kwwwwwwwwk.","..kkwwwwkk..","....kkkk...."];
const RAW = {
pradera_babyA:{pal:{k:K,b:'#9ae6a0',p:'#f2a2b8'},rows:[
"....kkkkkk....","..kkbbbbbbkk..",".kbbbbbbbbbbk.",".kbbkbbbbkbbk.","kbbbkbbbbkbbbk","kbpbbbbbbbbpbk","kbbbbkkkkbbbbk","kbbbbbbbbbbbbk",".kbbbbbbbbbbk.","..kkbbbbbbkk..","....kkkkkk...."],
blink:[[3,".kbbbbbbbbbbk."],[4,"kbkkbbbbbbkkbk"]]},
pradera_childA:{pal:{k:K,o:'#f0a04b',c:'#fbe6c2',w:'#ffffff'},rows:[
"..kk......kk..",".kook....kook.",".koook..koook.",".kooookkooook.","kooooooooooook","kokwooooookwok","koooookkoooook",".kooccccccook.",".koccccccccok.",".koccccccccok.",".kkoccccccokk.","..kokcccckok..","..kk.kkkk.kk.."],
blink:[[5,"kokkooooookkok"]]},
pradera_childB:{pal:{k:K,t:'#5ec8d8',l:'#bdf0f5',w:'#ffffff'},rows:[
"....kkkkkk....","..kkttttttkk..",".kttttttttttk.",".ktkwttttkwtk.","kttttttttttttk","ktlttkkkkttltk","kkttttttttttkk","kttttttttttttk",".kttttttttttk.",".kttttttttttk.","..kkttttttkk..","...kk.kk.kk..."],
blink:[[3,".ktkkttttkktk."]]},
pradera_adultA:{pal:{k:K,a:'#6db1ff',c:'#eef4ff',y:'#ffe066'},rows:[
".......kk.......","......kyyk......","..kk..kyyk..kk..",".kaak.kyyk.kaak.",".kaaakkaakkaaak.","kaaaaaaaaaaaaaak","kaakaaaaaaaakaak","kaaaaakkkkaaaaak","kaaaccccccccaaak",".kaaccccccccaak.",".kaaccccccccaak.",".kkaaccccccaakk.","..kkaaccccaakk..","...kakcccckak...","...kk.kkkk.kk...","..kkk.kkkk.kkk.."],
blink:[[6,"kakkaaaaaaaakkak"]]},
pradera_adultB:{pal:{k:K,p:'#f78fb3',l:'#ffd3e2',w:'#ffffff'},rows:[
"....kkkkkkkk....","..kkppppppppkk..",".kppppppppppppk.",".kpkppppppppkpk.","kppppppppppppppk","kplppkkkkkkpplpk","kppppkwwwwkppppk","kppppkkkkkkppppk","kkppppppppppppkk","kppppppppppppppk",".kppppppppppppk.",".kkppppppppppkk.","..kkkppppppkkk..","...kk.kkkk.kk..."],
blink:[[3,".kpkkppppppkkpk."]]},
brasa_babyA:{pal:{k:K,o:'#f8a04b',y:'#ffd94a'},rows:[
".....kk.....","....kook....","...koyyok...","..koyyyyok..",".koyyyyyyok.",".koykyykyok.","koyyyyyyyyok","koyykkkkyyok","kooyyyyyyook",".kooooooook.","..kooooook..","...kkkkkk..."],
blink:[[5,".kokkyykkok."]]},
brasa_childA:{pal:{k:K,r:'#e8574c',o:'#f8a04b',y:'#ffd94a'},rows:[
"......kk......",".....koyk.....","..k..kyyk..k..",".krk.kyyk.krk.",".krrkkrrkkrrk.","krrrrrrrrrrrrk","krkyrrrrrrykrk","krrrrkkkkrrrrk",".krrrrrrrrrrk.",".kroorrrroork.",".kkrroooorrkk.","..krkroorkrk..","..kk.kkkk.kk.."],
blink:[[6,"krkkrrrrrrkkrk"]]},
brasa_childB:{pal:{k:K,d:'#5a3a38',r:'#e8574c',y:'#ffd94a'},rows:[
"....kkkkkk....","..kkddddddkk..",".kddddrrddddk.",".kdkyddddkydk.","kddddddddddddk","kdrrddkkddrrdk","kddddrrrrddddk","kddddddddddddk",".kddrddddrddk.","..kkddddddkk..","...kk.kk.kk..."],
blink:[[3,".kdkkddddkkdk."]]},
brasa_adultA:{pal:{k:K,r:'#e8574c',o:'#f8a04b',y:'#ffd94a',c:'#fbe6c2'},rows:[
"..kk........kk..",".kyyk..kk..kyyk.",".kyyykkookkyyyk.","krrrrrrrrrrrrrrk","krkyrrrrrrrrykrk","krrrrrkkkkrrrrrk","krrrccccccccrrrk",".krrccccccccrrk.",".krrccccccccrrk.",".kkrrccccccrrkk.","..kkrrccccrrkk..","...krkcccckrk...","...kk.kkkk.kk...","..kkk.kkkk.kkk.."],
blink:[[4,"krkkrrrrrrrrkkrk"]]},
brasa_adultB:{pal:{k:K,d:'#6b4a3a',r:'#e8574c',y:'#ffd94a'},rows:[
"....kkkkkkkk....","...kryryryryk...","..kddddddddddk..",".kddddddddddddk.",".kdkyddddddkydk.","kddddddddddddddk","kddrrdkkkkdrrddk","kdddrrddddrrdddk","kddddrrddrrddddk","kddddddddddddddk","kddddddddddddddk",".kddddddddddddk.",".kkddddddddddkk.","..kk.kkkkkk.kk.."],
blink:[[4,".kdkkddddddkkdk."]]},
marea_babyA:{pal:{k:K,b:'#4a90d8',c:'#9adcf0'},rows:[
".....kk.....","....kbbk....","...kbbbbk...","..kbbbbbbk..",".kbbbbbbbbk.",".kbkbbbbkbk.","kbbbbbbbbbbk","kbcbkkkkbcbk","kbbbbbbbbbbk",".kbbbbbbbbk.","..kbbbbbbk..","...kkkkkk..."],
blink:[[5,".kbkkbbkkbk."]]},
marea_childA:{pal:{k:K,b:'#6aaee8',c:'#9adcf0',g:'#f28ab0',w:'#ffffff'},rows:[
"....kkkkkk....","..kkbbbbbbkk..",".gkbbbbbbbbkg.","ggkbkbbbbkbkgg",".gkbbbbbbbbkg.",".kbbcbbbbcbbk.","kbbbbkkkkbbbbk","kbbbbbbbbbbbbk",".kbbbbbbbbbbk.",".kbbwbbbbwbbk.","..kkbbbbbbkk..","...kk.kk.kk..."],
blink:[[3,"ggkbkkbbkkbkgg"]]},
marea_childB:{pal:{k:K,c:'#9adcf0',b:'#4a90d8',w:'#ffffff'},rows:[
"..w.kkkkkk.w..","..kkcccccckk..",".kcccccccccck.",".kckwcccckwck.","kcccccccccccck","kcbcckkkkccbck","kcccbccccbccck","kcccccccccccck",".kccbccccbcck.","..kkcccccckk..","...kk.kk.kk...",".w..........w."],
blink:[[3,".kckkccccckck."]]},
marea_adultA:{pal:{k:K,b:'#4a90d8',c:'#9adcf0',f:'#7ae0c8'},rows:[
"...kk......kk...","..kffk....kffk..","..kfffkkkkfffk..",".kbbbbbbbbbbbbk.",".kbkcbbbbbbckbk.",".kbbbbkkkkbbbbk.",".kbbccccccccbbk.","..kbbccccccbbk..","...kbbccccbbk...","..kbbccccccbbk..",".kbbccccccccbbk.",".kbbbbbbbbbbbbk.","..kbbbbbbbbbbk..","...kfkbbbbkfk...","..kff.kkkk.ffk.."],
blink:[[4,".kbkkbbbbbbkkbk."]]},
marea_adultB:{pal:{k:K,m:'#7a9ae8',c:'#c8e0f8'},rows:[
"....kkkkkkkk....","..kkmmmmmmmmkk..",".kmmmmmmmmmmmmk.",".kmkcmmmmmmckmk.","kmmmmmmmmmmmmmmk","kmcmmkkkkkkmmcmk","kmmmmmmmmmmmmmmk",".kmmcmmccmmcmmk.",".kkmmmmmmmmmmkk.","..kkkkkkkkkkkk..","..km.km.mk.mk...","..mk.km.mk.km...","..km.mk.km.mk...","...k..m..k..m..."],
blink:[[3,".kmkkmmmmmmkkmk."]]},
fungo_babyA:{pal:{k:K,r:'#d8574c',w:'#f6efe0',c:'#f0e0c0'},rows:[
"...kkkkk...","..krrwrrk..",".krrrrrwrk.",".kkkkkkkkk.",".kccccccck.",".kckccckck.","..kccccck..","...kkkkk..."],
blink:[[5,".kccccccck."]]},
fungo_babyB:{pal:{k:K,n:'#a4713a',c:'#f0e0c0',w:'#f6efe0'},rows:[
"....kkk....","...knwnk...","..knnnnnk..",".kkkkkkkkk.",".kccccccck.",".kckccckck.","..kccccck..","...kkkkk..."],
blink:[[5,".kccccccck."]]},
fungo_childA:{pal:{k:K,r:'#d8574c',w:'#f6efe0',c:'#f0e0c0'},rows:[
"...kkkkkkk...","..krrwrrrrk..",".krrrrrwrrrk.",".krwrrrrrrrk.","kkkkkkkkkkkkk",".kccccccccck.",".kckccccckck.",".kccccccccck.","..kccccccck..","...kk.kkk.k.."],
blink:[[6,".kccccccccck."]]},
fungo_childB:{pal:{k:K,n:'#a4713a',c:'#f0e0c0',g:'#7ac74f'},rows:[
".....kgk.....","....kgk......","..kkknnkk....",".knnnnnnnnk..","knnwnnnnnnnk.","knnnnnwnnnnk.","kkkkkkkkkkkk.",".kckcccckck..",".kcccccccck..","..kcccccck...","...kkkkkk...."],
blink:[[7,".kcccccccck.."]]},
fungo_adultA:{pal:{k:K,r:'#d8574c',w:'#f6efe0',c:'#f0e0c0'},rows:[
"....kkkkkkk....","..kkrrwrrrrkk..",".krrrrrrrwrrrk.",".krwrrrrrrrrrk.","kkkkkkkkkkkkkkk","..kccccccccck..","..kckccccckck..","kkkccccccccckkk","kcckccccccckcck","kkkkccccccckkkk","...kccccccck...","...kcckkkcck...","...kkk...kkk..."],
blink:[[6,"..kckkccckkck.."]]},
fungo_adultB:{pal:{k:K,n:'#a4713a',w:'#f6efe0',c:'#f0e0c0'},rows:[
"...kkkkkkkkkk...",".kknnnnwnnnnnkk.","knnnwnnnnnnwnnnk","knnnnnnnnwnnnnnk","kkkkkkkkkkkkkkkk",".kcccccccccccck.",".kckccccccckck..",".kcccccccccccck.",".kccccccccccck..",".kkccccccccckk..","..kkkkkkkkkkk..."],
blink:[[6,".kccccccccccck.."]]},
fungo_adultC:{pal:{k:K,r:'#d8574c',w:'#f6efe0',c:'#f0e0c0'},rows:[
"....kkkkkk....","..krrwrrrrk...",".krrrrrwrrrk..",".krwrrrrrwrk..","kkkkkkkkkkkkk.","..kccccccck...","..kckccckck...","..kccccccck...","...kccccck....","...kckkkck....","..kck...kck...","..kk.....kk..."],
blink:[[6,"..kckkccckk..."]]},
fungo_adultD:{pal:{k:K,n:'#a4713a',d:'#7a4e28',c:'#f0e0c0'},rows:[
"...kkkkkkkkkk...","..knnnndnnnnnk..",".knndnnnnnndnnk.","knnnnnnndnnnnnnk","kkkkkkkkkkkkkkkk",".kcccccccccccck.",".kckccccccckck..",".kcccccccccccck.",".kccccccccccck..","..kcccccccccck..","..kkcccccccckk..","...kkkkkkkkkk..."],
blink:[[6,".kccccccccccck.."]]},
fungo_adultS:{pal:{k:K,v:'#b88ae8',w:'#f6efe0',c:'#f0e0c0',y:'#ffd94a'},rows:[
".y.....y.....y..","....kkkkkkk.....","..kkvvwvvvvkk...",".kvvvvvvwvvvvk..",".kvwvvvvvvvwvk..","kkkkkkkkkkkkkkkk","..kcccccccccck..","..kckcccccckck..","y.kccccccccccky.","..kccccccccck...","...kcckkkcck....","...kkk...kkk...."],
blink:[[7,"..kckkcccckkk..."]]},
petrea_babyA:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78'},rows:[
"...kkkkkk...","..kssssssk..",".kssdssdssk.",".kskssssksk.","kssssssssssk","ksdskkkksdsk","kssssssssssk",".ksdssssdsk.","..kssssssk..","...kkkkkk..."],
blink:[[3,".kskksskksk."]]},
petrea_childA:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78'},rows:[
"..kkkkkkkkkk..",".kssssssssssk.",".kskssssssksk.",".kssskkkksssk.","..kssssssssk..","kkkddddddddkkk","kskddddddddksk","kskdsdssdsdksk","kskddddddddksk","kkkddddddddkkk","..kdddkkdddk..","..kdddkkdddk..",".kkkkk..kkkkk."],
blink:[[2,".kskksssskksk."]]},
petrea_childB:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78',g:'#7ac74f',w:'#ffffff'},rows:[
"..g.g.gg.g.g..","..kkggggggkk..",".kggggggggggk.",".kssgggggsssk.","kssssssssssssk","kskwsssssskwsk","kssdskkkksdssk","kssssssssssssk",".kssdssssdssk.","..kksssssskk..","...kk.kk.kk..."],
blink:[[5,"kskksssssskksk"]]},
petrea_adultA:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78',y:'#ffd94a'},rows:[
".kkkkkkkkkkkkkk.",".kssssssssssssk.",".kskyssssssyksk.",".kssskkkkkksssk.","..kksssssssskk..","kkkkddddddddkkkk","ksskddddddddkssk","ksskdsddddsdkssk","ksskddddddddkssk","kkskddddddddkskk","..kkddddddddkk..","...kdddkkdddk...","...kdddkkdddk...","..kkdddkkdddkk..",".kkkkkk..kkkkkk."],
blink:[[2,".kskksssssskksk."]]},
petrea_adultB:{pal:{k:K,s:'#9a9aa4',p:'#b88ae8'},rows:[
".kk...kk...kk...",".kppk.kppk.kppk.",".kppppkppkppppk.","kppppppppppppppk","kssppssssssppssk",".kssssssssssssk.",".kskpsssssspksk.","kssssskkkksssssk","kssppssssssppssk","kssssssssssssssk",".kssssssssssssk.",".kksssssssssskk.","..kk.kkkkkk.kk.."],
blink:[[6,".kskksssssskksk."]]},
voltio_babyA:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"...kkkkk...","..kyyyyyk..",".kyybyybyk.",".kykyyykyk.","kyyyyyyyyyk","kybykkkybyk",".kyywwwyyk.","..kyyyyyk..","...kkkkk..."],
blink:[[3,".kyyyyyyyk."]]},
voltio_babyB:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"...kbbk....","..kkkkkk...",".kyyyyyyk..",".kykyykyk..",".kyyyyyyk..",".kywwyywk..",".kyywwyyk..",".kyyyyyyk..","..kkkkkk..."],
blink:[[3,".kyyyyyyk.."]]},
voltio_childA:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
".....kk......","....kyyk.....","...kyyk......","..kkyyykk....",".kyyyyyyyk...","kyykyyyykyyk.","kyyyyyyyyyyk.","kybyykkyybyk.",".kyywwwwyyk..",".kyyyyyyyyk..","..kkyyyykk...","....kkkk....."],
blink:[[5,"kyykkyyykkyyk"]]},
voltio_childB:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"..kk....kk...",".kbyk..kybk..",".kyyykkyyyk..","kyyyyyyyyyyk.","kykyyyyyykyk.","kyyyyyyyyyyk.","kyybwwwwbyyk.","kyyyywwyyyyk.",".kyyyyyyyyk..","..kkkyykkk...","....kyyk.....",".....kk......"],
blink:[[4,"kykkyyyyykyk."]]},
voltio_adultA:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"......kk........",".....kyyk.......","....kyyk........","...kkyyykk......","..kyyyyyyyk.....",".kyykyyyykyk....",".kyyyyyyyyyk....","kkybyykkyybyk...","kyyyywwwwyyyk...","kyyywwwwwwyyk...",".kyyywwwwyyk....",".kkyyyyyyykk....","..kyyk..kyyk....","..kk......kk...."],
blink:[[5,".kyykkyyykkk...."]]},
voltio_adultB:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8',n:'#c9a227'},rows:[
"....kkkkkkkk....","..kknnnnnnnnkk..",".knnyyyyyyyynnk.",".kykyyyyyyyykyk.","kyyyyyyyyyyyyyyk","kybyykkkkkkyybyk","kyyywwwwwwwwyyyk","kyywwyywwyywwyyk",".kyyyywwwwyyyyk.",".kkyyyyyyyyyykk.","..kkkyyyyyykkk..","....kkkkkkkk...."],
blink:[[3,".kykkyyyyyykkyk."]]},
voltio_adultC:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"kk...........kk.","kbk.........kbk.","kbbk.kkkkk.kbbk.",".kbkyyyyyyykbk..",".kyyyyyyyyyyyk..","kyykyyyyyykyyk..","kyyyyyyyyyyyyk..","kybyykkkkyybyk..",".kyywwwwwwyyk...","..kyyywwyyyk....","...kyyyyyyk.....","...kyk..kyk.....","...kk....kk....."],
blink:[[5,"kyykkyyyykkyyk.."]]},
voltio_adultD:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',n:'#c9a227'},rows:[
"....kkkkkkkk....","..kkyyyyyyyykk..",".kyyyyyyyyyyyyk.",".kykyyyyyyyykyk.","kyyyyyyyyyyyyyyk","kynyykkkkkkyynyk","kyyyyyyyyyyyyyyk","kyywwyyyyyywwyyk","kyyywwwwwwwwyyyk",".kyyyyywwyyyyyk.",".kkyyyyyyyyyykk.","..kk.kkkkkk.kk.."],
blink:[[3,".kykkyyyyyykkyk."]]},
voltio_adultS:{pal:{k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},rows:[
"b......kk......b",".b....kyyk....b.","..kk.kyyk..kk...",".kbbkkyyykkbbk..",".kbyyyyyyyyybk..","kyykyyyyyyykyyk.","kyyyyykkyyyyyyk.","kybyyywwyyyybyk.","kyyywwwwwwwyyyk.",".kyywwwwwwyyk...","..kyyywwyyyk....",".kkyyyyyyyykk...","..kyyk..kyyk....","..kk......kk...."],
blink:[[5,"kyykkyyyyykkyyk."]]},
astro_babyA:{pal:{k:K,v:'#8a6ae8',n:'#4a3a9a',y:'#ffd94a'},rows:[
"...kkkkkk...","..kvvvvvvk..",".kvvnvvvnvk.",".kvkvvvvkvk.","kvvvvvvvvvvk","kvnvkkkkvnvk","kvvvvvvvvvvk",".kvvnvvnvvk.","..kvvvvvvk..","...kkkkkk...",".y........y."],
blink:[[3,".kvkkvvkkvk."]]},
astro_childA:{pal:{k:K,v:'#8a6ae8',y:'#ffd94a'},rows:[
"yy....kkkk....",".yy..kvvvvk...","..yykvvvvvvk..","...kvkvvvvkvk.","..kvvvvvvvvvvk",".ykvvvkkkkvvvk","..kvvvvvvvvvvk","...kvvvvvvvvk.","....kvvvvvvk..",".....kkkkkk...","........y..y.."],
blink:[[3,"...kvkkvvkkvk."]]},
astro_childB:{pal:{k:K,v:'#8a6ae8',y:'#ffd94a',w:'#ffffff'},rows:[
"..kk.kkkk.kk..",".kvvkvvvvkvvk.","kvvvvvvvvvvvvk","kvkwvvvvvvkwvk","kvvvvvvvvvvvvk","kvyvvkkkkvvyvk","kvvvvvvvvvvvvk",".kvvyvvvvyvvk.","..kvvvvvvvvk..","...kkvvvvkk...",".....kkkk....."],
blink:[[3,"kvkkvvvvvvkkvk"]]},
astro_adultA:{pal:{k:K,v:'#8a6ae8',y:'#ffd94a',w:'#ffffff'},rows:[
".....kkkkkk.....","....kyykkyyk....","....kkkkkkkk....","...kvvvvvvvvk...","..kvvvvvvvvvvk..","..kvkwvvvvkwvk..","..kvvvvkkvvvvk..","...kvvvvvvvvk...",".k.kvvvvvvvvk.k.",".kkvvyvvvvyvvkk.","..kvvvvvvvvvvk..","..kvvvvyyvvvvk..","...kvvvvvvvvk...","....kvkvvkvk....","....kk.kk.kk...."],
blink:[[5,"..kvkkvvvvkkvk.."]]},
astro_adultB:{pal:{k:K,n:'#3a3468',v:'#8a6ae8',y:'#ffd94a'},rows:[
"....kkkkkkkk....","..kknnnnnnnnkk..",".knnnnnnnnnnnnk.",".knkynnnnnnyknk.","knnnnnnnnnnnnnnk","yyknnnkkkknnnkyy","kyyyyyyyyyyyyyyk","knnnnnnnnnnnnnnk","knnvnnnnnnnnvnnk",".knnnnvnnvnnnnk.",".knnnnnnnnnnnnk.",".kknnnnnnnnnnkk.","..kkknnnnnnkkk..","....kkkkkkkk...."],
blink:[[3,".knkknnnnnnkknk."]]},
pradera_adultC:{pal:{k:K,t:'#5ec8d8',l:'#bdf0f5',w:'#ffffff'},rows:[
".kk........kk.",".ktk......ktk.",".ktk......ktk.",".kttk....kttk.","..kttkkkkttk..",".kttttttttttk.",".ktkwttttkwtk.","kttttkkkkttttk","kttttttttttttk",".kttltlltlttk.","..kttttttttk..","...kttkkttk...","...ktk..ktk...","...ktk..ktk...","..kkk....kkk.."],
blink:[[6,".ktkkttttkktk."]]},
pradera_adultD:{pal:{k:K,t:'#5ec8d8',l:'#bdf0f5',w:'#ffffff'},rows:[
".....kkkkkk.....","...kkttttttkk...",".kttttttttttttk.",".ktkwttttttkwtk.","kttttttttttttttk","ktlttkkkkkkttltk","kttttttttttttttk","ktttlllllllltttk","kttllllllllllttk",".kttllllllllttk.",".kkttttttttttkk.","..kkttttttttkk..","...kk.kkkk.kk..."],
blink:[[3,".ktkkttttttkktk."]]},
brasa_adultC:{pal:{k:K,o:'#f8a04b',y:'#ffd94a'},rows:[
"......kk......",".....koyk.....","....koyyok....","...koyyyyok...","..koyyyyyyok..","..kokyyyykok..","..koyykkyyok..","...koyyyyok...","k..koyyyyok..k","kk..koyyok..kk",".k..koyyok..k.","....koyyok....","....koook.....",".....koyk.....","......kk......"],
blink:[[5,"..kokkyykkok.."]]},
brasa_adultD:{pal:{k:K,d:'#6b4a3a',r:'#e8574c',y:'#ffd94a',w:'#ffffff'},rows:[
"..kk........kk..",".kddk......kddk.",".kdddkkkkkkdddk.","kddddddddddddddk","kdkyddddddddykdk","kddddddddddddddk","kdkkkkkkkkkkkkdk","kdkrwrwrwrwrwkdk","kdkkkkkkkkkkkkdk","kddrrddddddrrddk",".kddddddddddddk.","..kk.kkkkkk.kk.."],
blink:[[4,"kdkkddddddddkkdk"]]},
marea_adultC:{pal:{k:K,b:'#4a90d8',c:'#9adcf0',f:'#7ae0c8'},rows:[
"....kkkkkk....","..kkbbbbbbkk..",".kbbbbbbbbbbk.",".kbkcbbbbckbk.","kbbbbkkkkbbbbk","kfbbccccccbbfk","kffbccccccbffk",".kfbccccccbfk.","..kbbccccbbk..","..kbbbbbbbbk..","...kbbbbbbk...","...kfbbbbfk...","..kff.kk.ffk..",".kff......ffk."],
blink:[[3,".kbkkbbbbkkbk."]]},
marea_adultD:{pal:{k:K,c:'#9adcf0',b:'#4a90d8',w:'#ffffff'},rows:[
"..k....kk....k..","...k..kcck..k...","..kkkcccccckkk..",".kcccccccccccck.","kcckwccccccwkcck","kcccccccccccccck","kccccbkkkkbcccck","kccbccccccccbcck",".kccccbccbcccck.","..kkkcccccckkk..","...k..kcck..k...","..k....kk....k..","......k..k......"],
blink:[[4,"kcckkccccccckcck"]]},
petrea_adultC:{pal:{k:K,n:'#3a3a48',p:'#b88ae8'},rows:[
"......kk......",".....knnk.....","....knnnnk....","...knnnnnnk...","..knnpnnpnnk..","..knnnnnnnnk..",".knnnkkkknnnk.",".knnnnnnnnnnk.","knnpnnnnnnpnnk","knnnnnnnnnnnnk",".knnnnnnnnnnk.","..knnnknnnk...","..knnk..knnk..",".kknk....knkk.",".kk........kk."],
blink:[[4,"..knnknnknnk.."]]},
petrea_adultD:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78',g:'#7ac74f'},rows:[
"..g.gg..gg.g....","...kkgggggkk....","..kgggggggggk...",".kssgggggggssk..",".kssssssssssssk.","kssksssssssskssk","kssssskkkksssssk","kssdssssssssdssk","kssssdssssdssssk","kssssssssssssssk",".kssssssssssssk.",".kksssssssssskk.","..kkkkkkkkkkkk.."],
blink:[[5,"ksskksssssskkssk"]]},
astro_adultC:{pal:{k:K,v:'#8a6ae8',y:'#ffd94a'},rows:[
"yy.....kkkk.....",".yy...kyyyyk....","..yy.kyyyyyyk...","....kykyyyykyk..","...kyyykkyyyk...","..kyyyyyyyyyyk..","...kyyyvvyyyk...","...kyyyyyyyyk...","....kyykkyyk....","...kyk..kyyk....","..kyk....kyk....",".kkk......kkk..."],
blink:[[3,"....kykkyykkyk.."]]},
astro_adultD:{pal:{k:K,v:'#8a6ae8',n:'#4a3a9a',y:'#ffd94a',c:'#c8b8f8',w:'#ffffff'},rows:[
"....kkkkkkkk....","..kkvvvvvvvvkk..",".kvvcvvvvvvcvvk.",".kvkwvvvvvvkwvk.","kvvvvvvvvvvvvvvk","yykvvkkkkkkvvkyy","kyyyyyyyyyyyyyyk","kvvcvvvvvvvvcvvk","kvvvvvcvvcvvvvvk",".kvvvvvvvvvvvvk.",".kkvvvvvvvvvvkk.","..kkvvvvvvvvkk..","...kkkkkkkkkk...","....kk....kk...."],
blink:[[3,".kvkkvvvvvvkkvk."]]},
pradera_babyB:{pal:{k:K,g:'#8ad87a',l:'#c8f0a8'},rows:[
"...kk..kk...","...klkklk...","....kggk....","..kkggggkk..",".kggggggggk.",".kgkggggkgk.","kggggggggggk","kglgkkkkglgk","kggggggggggk",".kggggggggk.","..kkggggkk..","....kkkk...."],
blink:[[5,".kgkkggkkgk."]]},
brasa_babyB:{pal:{k:K,h:'#b8a8a0',r:'#e8574c'},rows:[
"..kk.kk.kk..",".khhkhhkhhk.","khhhhhhhhhhk","khkhhhhhhkhk","khhhhhhhhhhk","khrhkkkkhrhk","khhhhhhhhhhk",".khhhhhhhhk.","..khhhhhhk..","...khhhhk...","....khhk....",".....kk....."],
blink:[[3,"khkkhhhhkkhk"]]},
marea_babyB:{pal:{k:K,b:'#4a90d8',c:'#9adcf0'},rows:[
".....kk.....","....kbbk....","....kbbk....","...kbbbbk...","..kbbbbbbk..",".kbkbbbbkbk.",".kbbbbbbbbk.","kbcbkkkkbcbk","kbbbbbbbbbbk",".kbbbbbbbbk.","c.kbbbbbbk.c","..ckkkkkkc.."],
blink:[[5,".kbkkbbkkbk."]]},
petrea_babyB:{pal:{k:K,s:'#9a9aa4',p:'#b88ae8'},rows:[
"....kpk.....","...kkpkk....","..kssssssk..",".kssssssssk.",".kskssssksk.","kssssssssssk","kspskkkkspsk","kssssssssssk",".ksspsspssk.","..kssssssk..","...kkkkkk..."],
blink:[[4,".kskksskksk."]]},
astro_babyB:{pal:{k:K,y:'#ffd94a',v:'#8a6ae8'},rows:[
".....kk.....","....kyyk....","....kyyk....","kkkkyyyykkkk","kyyyyyyyyyyk",".kykyyyykyk.","..kyyyyyyk..","..kykkkkyk..","..kyykkyyk..",".kyyk..kyyk.",".kkk....kkk."],
blink:[[5,".kykkyykkyk."]]},
pradera_adultS:{pal:{k:K,p:'#f78fb3',g:'#8ad87a',l:'#c8f0a8',w:'#ffffff'},rows:[
".....kpppk......","..kpkkpppkkpk...",".kpppkgggkpppk..",".kpkgggggggkpk..","..kgkwgggkwgk...","..kggggkkgggk...",".kpkgggggggkpk..","..kpkkgggkkpk...","....kkgggkk.....",".....kgggk......","..kk.kgggk.kk...",".klkkkgggkkklk..","..kk.kgggk.kk...",".....kgggk......","....kkkkkkk....."],
blink:[[4,"..kgkkgggkkgk..."]]},
brasa_adultS:{pal:{k:K,r:'#e8574c',o:'#f8a04b',y:'#ffd94a',w:'#ffffff'},rows:[
".......kk.......","......koyk......",".....koyyok.....","kk..koyyyyok..kk","krk.koyyyyok.krk","krrkkywyywykkrrk","krrrkoyyyyokrrrk",".krrkoykkyokrrk.","..krkoyyyyokrk..","...kkoyyyyokk...","....koyyyyok....","....koyyyyok....",".....koyyok.....","....kko..okk....","...kk......kk..."],
blink:[[5,"krrkkkyyyykkkrrk"]]},
marea_adultS:{pal:{k:K,n:'#2a4a8a',b:'#4a90d8',f:'#7ae0c8',y:'#ffd94a',w:'#ffffff'},rows:[
"......ky........",".....kk.........","....kknnnnkk....","...knnnnnnnnk...","..knnkynnyknnk..","..knnnnnnnnnnk..",".knnkwkwkwkwnnk.",".knnnnnnnnnnnnk.","kfknnbbbbbbnnkfk","kffknnbbbbnnkffk",".kknnnbbbbnnnkk.","..knnnnnnnnnnk..","...knnnkknnnk...","..kfnk....knfk..",".kff........ffk."],
blink:[[4,"..knnkknnkknnk.."]]},
petrea_adultS:{pal:{k:K,s:'#9a9aa4',d:'#6a6a78',p:'#b88ae8'},rows:[
"..kpk.kppk.kpk..",".kpppkkppkkpppk.",".kssssssssssssk.",".kskpsssssspksk.",".kssskkkkkksssk.","kkksssssssssskkk","kpskddddddddkspk","kpskdpddddpdkspk","ksskddddddddkssk","kkskddddddddkskk","..kkddddddddkk..","...kdddkkdddk...","..kkdddkkdddkk..",".kpkkkk..kkkkpk."],
blink:[[3,".kskksssssskksk."]]},
astro_adultS:{pal:{k:K,n:'#3a3468',v:'#8a6ae8',y:'#ffd94a',w:'#ffffff'},rows:[
"......y.........","....kkkkkkkk....","..kknnnnnnnnkk..",".knnvnnnnnnvnnk.",".knkwnnnnnnwknk.","knnnnnvvnnnnnnnk","knnnnnkkkknnnnnk","kvnnynnnnnnynnvk","knnnnnnvvnnnnnnk",".knnynnnnnnynnk.",".kknnnnnnnnnnkk.","y.kkknnnnnnkkk..","....kkkkkkkk....",".....kk..kk....."],
blink:[[4,".knkknnnnnnkknk."]]},
grimo:{pal:{k:K,u:'#9d7bd8',d:'#6b4fa3',w:'#f4f0ff'},rows:[
"..kk......kk..",".kuuk....kuuk.",".kuuukkkkuuuk.","kuuuuuuuuuuuuk","kukkuuuuuukkuk","kuuwuuuuuuwuuk","kuuuuuuuuuuuuk","kuukkkkkkkkuuk","kuuuuuuuuuuuuk","kuuuuuuuuuuuuk","kuduuduuduuduk",".kuuduuduuduk.",".kukk.kk.kkuk.",".kk........kk."],
blink:[[5,"kuukuuuuuukuuk"]]}
};
let SPR = {};
function buildAllSprites(){
  SPR = {};
  for(const key in RAW){
    const d = RAW[key];
    const f0 = mkSprite(d.pal, d.rows);
    let f1 = f0;
    if(d.blink){
      const rows2 = d.rows.slice();
      for(const pair of d.blink) rows2[pair[0]] = pair[1];
      f1 = mkSprite(d.pal, rows2);
    }
    SPR[key] = [f0, f1];
  }
  for(const ln of LINE_KEYS){
    const L = LINES[ln];
    SPR['egg_'+ln] = [mkSprite({k:K,w:L.eggShell,g:L.eggSpot}, EGG_ROWS)];
  }
  SPR.egg_mystery = [mkSprite({k:K,w:'#cfc9bd',g:'#a29c92'}, EGG_ROWS)];
  SPR.eggCrack = mkSprite({k:K},[
"............","............","............",".....k......","....k.k.....",".....k.k....","....k.......","............","............","............","............","............","............"]);
  SPR.poop = mkSprite({k:K,p:'#a4713a'},[
"...kk...","..kppk..",".kppppk.",".kppppk.","kppppppk","kppppppk",".kkkkkk."]);
  SPR.meal = mkSprite({k:K,b:'#f6d186',t:'#e8c060',g:'#7ac74f',m:'#a04a32',r:'#e2574c',w:'#fff8d0'},[
"...kkkkk...","..kbbbbbk..",".kbwbbbwbk.",".kgggggggk.",".krrrrrrrk.",".kmmmmmmmk.",".ktttttttk.","..ktttttk..","...kkkkk..."]);
  SPR.snack = mkSprite({k:K,c:'#f2a2b8',d:'#d8578a',w:'#fff8d0',y:'#ffd94a',s:'#e2574c',b:'#f6d186'},[
"..kkkkkk..",".kcysccwk.","kcck..kcck","kwck..kyck",".kbdbbdbk.","..kkkkkk.."]);
  SPR.shroom = mkSprite({k:K,r:'#d8574c',w:'#f6efe0',s:'#e8d8b8'},[
"...kkkkkkkk...","..krrwwrrrrk..",".krrrrrrwwrrk.","krwwrrrrrrrrwk","krrrrrwwrrrrrk","kkkkkkkkkkkkkk",".ksssskkssss..","..kssssssssk..","..kssssssssk..","...kkkkkkkk..."]);
  SPR.fruta = mkSprite({k:K,g:'#57a05e',l:'#7ac74f',r:'#e2574c',d:'#a03030',w:'#ff9a90'},[
"....kk...","...klgk..","....k....",".krrkrrk.","krwrrrrdk","krwrrrrdk","krrrrrddk",".krrrddk.","..kkkkk.."]);
  SPR.pescado = mkSprite({k:K,b:'#5e9be0',c:'#9adcf0',d:'#3a6bb0',w:'#ffffff'},[
"...kkkk...k.",".kkbccck.kdk","kbwkbbbbkddk","kbkkbbbbdddk",".kkbbbdk.kdk","...kkkk...k."]);
  SPR.picante = mkSprite({k:K,g:'#7ac74f',e:'#57a05e',r:'#e2574c',d:'#a03030',w:'#ff9a90'},[
"....kgg.","...kgek.","..krrk..",".krwrdk.",".krwrdk.","krrrrdk.","krrrddk.","krrddk..",".kkkk..."]);
  SPR.pastel = mkSprite({k:K,y:'#ffd94a',w:'#ffffff',p:'#f78fb3',d:'#d8578a',c:'#fbe6c2',s:'#e8c060'},[
"....krk...","....kwk...",".kkkkkkkk.","kpwpwpwppk","kpppppppdk","kkkkkkkkkk","kcwcccccsk","kccccccssk",".kkkkkkkk."]);
  SPR.sopa = mkSprite({k:K,y:'#ffd94a',n:'#3a4a8a',u:'#28366a',w:'#f6efe0'},[
"..w...w...","...w...w..",".kkkkkkkk.","knynynynnk","knnnnnnnuk",".kwwwwwwk.","..kwwwwk..","...kkkk..."]);
  SPR.setita = mkSprite({k:K,r:'#d8574c',d:'#a03030',w:'#f6efe0',s:'#e8d8b8'},[
"..kkkk..",".krwrrk.","krrrrwrk","kddddddk",".kssssk.",".kssssk.","..kkkk.."]);
  SPR.pelota = mkSprite({k:K,r:'#e2574c',d:'#a03030',w:'#ffffff',c:'#f0f0f8'},[
"..kkkkk..",".kwwrrrk.","kwwwrrrdk","kwwrrrrdk","kwrrrrddk","krrrrdddk",".krrdddk.","..kkkkk.."]);
  SPR.caja = mkSprite({k:K,p:'#9d7bd8',v:'#7a5ab8',y:'#ffd94a',o:'#c9a227'},[
"...kyyk...","..kyyyyk..",".kkkkkkkk.","kpppyypppk","kpppyypppk","kkkkkkkkkk","kvvvyovvvk","kvvvyovvvk",".kkkkkkkk."]);
  SPR.banera = mkSprite({k:K,w:'#f6efe0',e:'#d8d0c0',b:'#5e9be0',c:'#9adcf0'},[
"..c..c..c.....",".kkkkkkkkkkkk.","kwccbccbccbcwk","kwbbbbbbbbbbwk","kwwbbbbbbbbwwk",".kwwwwwwwwwwk.",".keekkkkkkeek.","..kk......kk.."]);
  SPR.tambor = mkSprite({k:K,r:'#e2574c',d:'#a03030',c:'#fbe6c2',s:'#e8c060',w:'#f6efe0'},[
".w........w.",".kw......wk.","..kkkkkkkk..",".kcccccscck.","kkkkkkkkkkkk","krwrkrrkrwrk","krrkrrrrkrrk","krkrrddrrkdk","kkkkkkkkkkkk"]);
  /* gorros */
  SPR.hat_lazo = mkSprite({k:K,p:'#f78fb3',d:'#d8578a',w:'#ffd3e2'},[
"kk..k..kk","kwpkdkpdk","kppkdkddk",".kk.k.kk."]);
  SPR.hat_flor = mkSprite({k:K,y:'#ffd94a',o:'#c9a227',p:'#f2a2b8',w:'#fff8f0'},[
"..kkk..",".kwppk.","kpyyopk",".kpppk.","..kkk.."]);
  SPR.hat_seta = mkSprite({k:K,r:'#d8574c',d:'#a03030',w:'#f6efe0'},[
"..kkkkk..",".krwrrrk.","krrrwrrrk","kdddddddk",".kkkkkkk."]);
  SPR.hat_copa = mkSprite({k:K,n:'#2a2438',h:'#453e60',r:'#e2574c',d:'#a03030'},[
"..kkkkk..","..khnnk..","..khnnk..","..krrdk..","knnnnnnnk",".kkkkkkk."]);
  SPR.hat_corona = mkSprite({k:K,y:'#ffd94a',o:'#c9a227',r:'#e2574c',b:'#5e9be0'},[
"k.k.k.k.k","kykykykyk","kyyrybyyk","kyoooooyk","kkkkkkkkk"]);
  SPR.hat_buho = mkSprite({k:K,u:'#9d7bd8',v:'#7a5ab8',y:'#ffd94a'},[
"....k....","...kuk...","..kuvuk..",".kuuuvuk.","kuyuyuyuk",".kkkkkkk."]);
  SPR.hat_gafas = mkSprite({k:K,n:'#20243c',c:'#8fd8e8'},[
"kkkkkkkkk","kcnkkkcnk",".kk...kk."]);
  SPR.hat_pajarita = mkSprite({k:K,r:'#e2574c',d:'#a03030',w:'#ff9a90'},[
"kk...kk","kwrkrdk","krdkddk","kk...kk"]);
  SPR.hat_halo = mkSprite({k:'#c9a227',y:'#ffd94a',w:'#fff8d0'},[
".kkkkkkk.","kyywyyywk",".kkkkkkk."]);
  SPR.hat_laurel = mkSprite({k:'#3d6b2f',g:'#7ac74f',e:'#57a05e',y:'#ffd94a'},[
".gk.....kg.","gke.kyk.ekg",".gke...ekg.","..kge.egk..","....kkk...."]);
  SPR.hat_vikingo = mkSprite({k:K,w:'#f6efe0',e:'#d8d0c0',s:'#c8c8d4',n:'#8a6a3a',d:'#6a5230'},[
"kk.......kk","kwk.....kwk","kwek...kewk","kwwkkkkkwwk",".kknnsnnkk.","..kdddddk..","...kkkkk..."]);
}

const IC = {};
/* botonera 12x12: cada acción con su carácter */
IC.feed = mkSprite({k:'#3b2f2f',m:'#c98a4b',w:'#f6efe0',d:'#a4713a'},[
"......kkk...",".....kmmmk..","....kmmmmmk.","...kmmdmmmk.","...kmmmmmk..","..kmdmmmk...","..kmmmmk....",".kwkmmk.....","kwwkkk......","kwwk........",".kk.........","............"]);
IC.play = mkSprite({k:'#3b2f2f',r:'#e2574c',w:'#ff9a90',y:'#ffd94a'},[
"...kkkkk....","..kwrrrrk...",".kwrryrrrk..",".krryyyrrk..",".kryyyyyrk..",".krryyyrrk..",".krrryrrrk..","..krrrrrk...","...kkkkk....","............","............","............"]);
IC.clean= mkSprite({k:'#3b2f2f',h:'#8a6a3a',s:'#e8c060',c:'#5ec8d8'},[
".........kk.","........khk.","...c...khk..","......khk...",".....khk....","....khk.....","...ksk......","..kssk......",".kssssk.....","kssssk...c..","kkkkk.......","............"]);
IC.sleep= mkSprite({k:'#3b2f2f',y:'#ffd94a',w:'#fff8d0'},[
"....kkk.....","...kyyk.....","..kyyk......",".kyyk....w..",".kyyk.......",".kyyk.......",".kyyyk...w..","..kyyyk.....","...kyyyykk..","....kkkk....","............","............"]);
IC.shop = mkSprite({k:'#3b2f2f',n:'#a4713a',y:'#ffd94a',d:'#7a4e28'},[
"....kk......","...knnk.....","..kddddk....",".knnnnnnk...","knnnnynnnk..","knnnyyynnk..","knnnnynnnk..","knnnnnnnnk..",".knnnnnnk...","..kkkkkk....","............","............"]);
IC.stats= mkSprite({k:'#3b2f2f',c:'#f6efe0',r:'#e2574c',d:'#8a8070'},[
".kkkkkkkkk..",".krkcccccck.",".krkcdddcck.",".krkcccccck.",".krkcddccck.",".krkcccccck.",".krkcdddcck.",".krkcccccck.",".kkkkkkkkk..","............","............","............"]);
/* categorías de JUGAR */
IC.gym = mkSprite({k:'#3b2f2f',d:'#6a6a78',s:'#9a9aa4'},[
"............",".kk......kk.","kddk....kddk","kddkkkkkkddk","kddksssskddk","kddkkkkkkddk","kddk....kddk",".kk......kk.","............","............","............","............"]);
IC.map = mkSprite({k:'#3b2f2f',r:'#e2574c',w:'#f6efe0',h:'#8a6a3a'},[
"..kk........","..khkkkkk...","..khrrrrrk..","..khrwwrrrk.","..khrrrrrk..","..khkkkkk...","..khk.......","..khk.......","..khk.......","..khk.......",".kkkkk......","............"]);

let ESPR = {};
function buildEnemySprites(){
  ESPR.ratuco = mkSprite({k:K,m:'#a07850',w:'#ffffff'},[
"..kk......kk..",".kmmk....kmmk.",".kmmmkkkkmmmk.","kmmmmmmmmmmmmk","kmkwmmmmmmwkmk","kmmmmkwwkmmmmk","kmmmmmmmmmmmmk",".kmmmmmmmmmmk.","..kmmkmmkmmk..","..kk..kk..kk.."]);
  ESPR.pinchon = mkSprite({k:K,g:'#6aa84f',d:'#4a7838',w:'#ffffff'},[
"..k...kk...k..","...k.kggk.k...","..kkkggggkkk..",".kggggggggggk.","kgkwggggggwkgk","kggggggggggggk","kggggkkkkggggk","kggdggggggdggk",".kggggggggggk.","..kkkggggkkk..","...k.kggk.k...","..k...kk...k.."]);
  ESPR.lobruno = mkSprite({k:K,l:'#5a5464',d:'#3e3a4a',r:'#e8574c',w:'#ffffff'},[
".kk..........kk.",".kllk......kllk.",".klllkkkkkklllk.","kllllllllllllllk","klkrllllllllrklk","kllllllllllllllk","klkwkwkwkwkwkllk","kllllkkkkkkllllk","kllldllldllldllk",".kllllllllllllk.","..klldlldlldlk..","..kk.kk..kk.kk.."]);
  ESPR.chispin = mkSprite({k:K,o:'#f8a04b',y:'#ffd94a',r:'#e8574c'},[
"..k......k..",".kok....kok.",".koyk..kyok.","..koykkyok..",".koyyyyyyok.","koyykyykyyok","koyyyyyyyyok",".koykkkkyok.",".kooyyyyook.","..kooooook..","...kkkkkk..."]);
  ESPR.burbujon = mkSprite({k:K,b:'#4a90d8',c:'#9adcf0',w:'#ffffff'},[
"...kkkkkkk...","..kccccccck..",".kccbbbbbcck.","kccbwbbbbbcck","kcbbbkbbkbbck","kcbbbbbbbbbck","kcbbbkkbbbbck",".kcbbbbbbbck.","..kccbbbcck..","...kkkkkkk...","..c.......c.."]);
  ESPR.roquijo = mkSprite({k:K,s:'#9a9aa4',d:'#6a6a78',r:'#e8574c'},[
".kk........kk.","kddk......kddk","kdddkkkkkkdddk",".kdsssssssssk.",".ksdsrssrsdsk.","ksssssssssssk.","ksdsskkkkssdsk","kssssssssssssk",".ksdssssssdsk.","..kkssssssk...","..kdk.kk.kdk..",".kk........kk."]);
  ESPR.polillux = mkSprite({k:K,v:'#8a6ae8',l:'#c8b8f8',y:'#ffd94a'},[
"kk..........kk","kvvk......kvvk",".kvvk.kk.kvvk.",".kvlvkyykvlvk.","..kvvkyykvvk..",".kvlvvyyvvlvk.","kvvvkyyyykvvvk","kvlvkyyyykvlvk",".kvvkkkkkkvvk.","..kk..yy..kk..","......kk......"]);
  ESPR.ladronzuelo = mkSprite({k:K,m:'#a07850',d:'#3a3440',w:'#ffffff'},[
"..kk......kk..",".kmmk....kmmk.",".kmmmkkkkmmmk.","kmmmmmmmmmmmmk","kddddddddddddk","kdwkddddddkwdk","kmmmmmmmmmmmmk",".kmmkwwwwkmmk.",".kmmmmmmmmmmk.","..kmmkmmkmmk..","..kk.k..k.kk..",".............."]);
  ESPR.reyseto = mkSprite({k:K,r:'#d8574c',w:'#f6efe0',c:'#f0e0c0',y:'#ffd94a'},[
"...y..y..y......","...k..k..k......","..kykkykkyk.....",".kkkkkkkkkkkk...",".krrwrrrrwrrrk..","krrrrrwrrrrrrrk.","krwrrrrrrrwrrrk.","kkkkkkkkkkkkkkk.",".kccccccccccck..",".kckcccccckck...",".kcccccccccck...",".kcckkkkkkck....","..kkk....kkk...."]);
  ESPR.setazo = mkSprite({k:K,g:'#57a05e',w:'#f6efe0',c:'#e8d8b8'},[
"...kkkkkkkk...","..kggwggggwk..",".kgggggwgggk..","kwggwgggggwgk.","kkkkkkkkkkkkk.",".kcckcckcck...",".kcckcckcck...",".kcccccccck...","..kkcccckk....","...kkkkkk....."]);
  ESPR.cuervillo = mkSprite({k:K,n:'#2a2a38',w:'#f6efe0',o:'#f0a04b'},[
"kk.........kk.","knnk.......knn",".knnk..kk.knnk",".knnnkknnknnk.","..knnnnnnnnk..","..knkwnnwknk..","..knnnnnnnnk..","...knnoonnk...","....knnnnk....","...kk.oo.kk...","......kk......"]);
  ESPR.relampin = mkSprite({k:K,y:'#ffd94a',w:'#fff8d0',b:'#5ec8d8'},[
".....kkk......","....kyyyk.....","...kyyyk......","..kyyyykkk....",".kyyyyyyyk....","kyykyyykyyk...","kyyyyyyyyyk...","kyybkkkbyyk...",".kyywwwyyk....","..kyyyyk......","...kyyk.......","....kk........"]);
  ESPR.sombrio = mkSprite({k:K,s:'#4a4460',r:'#e8574c',w:'#c8c0e0'},[
"....kkkkkk....","..kksssssskk..",".kssssssssssk.",".kskrssssrksk.","kssssssssssssk","ksskwkwkwkwssk","kssssssssssssk",".kssssssssssk.","..kssksskssk..","..ks..ks..sk..","..k....k....k."]);
}
