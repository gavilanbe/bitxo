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
  SPR.meal = mkSprite({k:K,r:'#e2574c',b:'#f6d186',g:'#7ac74f'},[
"..kkkkkk..",".kbbbbbbk.","kbgbgbgbbk","kkkkkkkkkk","krrrrrrrrk",".krrrrrrk.","..kkkkkk.."]);
  SPR.snack = mkSprite({k:K,c:'#f2a2b8',w:'#fff',s:'#e2574c'},[
"...kkkk...","..kssssk..",".kcwcwcck.",".kcccccck.",".kwcwcwck.","..kccck...","...kkk...."]);
  SPR.shroom = mkSprite({k:K,r:'#d8574c',w:'#f6efe0',s:'#e8d8b8'},[
"...kkkkkkkk...","..krrwwrrrrk..",".krrrrrrwwrrk.","krwwrrrrrrrrwk","krrrrrwwrrrrrk","kkkkkkkkkkkkkk",".ksssskkssss..","..kssssssssk..","..kssssssssk..","...kkkkkkkk..."]);
  SPR.fruta = mkSprite({k:K,g:'#7ac74f',r:'#e2574c',w:'#ffffff'},[
"...kk...","..kgk...",".krrrrk.","krrrrrrk","krwrrrrk","krrrrrrk",".krrrrk.","..kkkk.."]);
  SPR.pescado = mkSprite({k:K,b:'#5e9be0',w:'#ffffff'},[
"..kkkk..k.",".kbbbbkkbk","kbwbbbbbbk","kbbbbbbkbk",".kbbbbkkbk","..kkkk..k."]);
  SPR.picante = mkSprite({k:K,g:'#7ac74f',r:'#e2574c'},[
"...kg..","..kgk..","..krk..",".krrk..",".krrk..","krrrk..","krrk...","krrk...",".kk...."]);
  SPR.pastel = mkSprite({k:K,y:'#ffd94a',w:'#ffffff',p:'#f78fb3',c:'#fbe6c2'},[
"....ky....","....kw....",".kkkkkkkk.","kppppppppk","kwpwpwpwpk","kcccccccck","kcccccccck",".kkkkkkkk."]);
  SPR.sopa = mkSprite({k:K,y:'#ffd94a',n:'#3a4a8a',w:'#f6efe0'},[
"...ky.k...",".kkkkkkkk.","knnnynnnnk","knnnnnnnnk",".kwwwwwwk.","..kwwwwk..","...kkkk..."]);
  SPR.setita = mkSprite({k:K,r:'#d8574c',w:'#f6efe0',s:'#e8d8b8'},[
".kkkkkk.","krwrrwrk","krrrrrrk","kkkkkkkk",".kssssk.",".kssssk.","..kkkk.."]);
  SPR.pelota = mkSprite({k:K,r:'#e2574c',w:'#ffffff'},[
"..kkk..",".krrwk.","krrrwwk","krrwwwk","krwwwwk",".krwwk.","..kkk.."]);
  SPR.caja = mkSprite({k:K,p:'#9d7bd8',y:'#ffd94a'},[
"kkkkkkkkkk","kppyyppyyk","kppppppppk","kyyppppyyk","kppppppppk","kppyyppyyk","kkkkkkkkkk"]);
  /* gorros */
  SPR.hat_lazo = mkSprite({k:K,p:'#f78fb3',d:'#d8578a'},[
"kk...kk","kppkppk","kpdkdpk",".kk.kk."]);
  SPR.hat_flor = mkSprite({k:K,y:'#ffd94a',p:'#f2a2b8'},[
".kpk.","kpypk",".kpk."]);
  SPR.hat_seta = mkSprite({k:K,r:'#d8574c',w:'#f6efe0'},[
"..kkkk..",".krwrrk.","krrrrwrk","kkkkkkkk"]);
  SPR.hat_copa = mkSprite({k:K,n:'#2a2438',r:'#e2574c'},[
"..kkkk..","..knnk..","..krrk..","kkkkkkkk"]);
  SPR.hat_corona = mkSprite({k:K,y:'#ffd94a',r:'#e2574c'},[
"k.k.k.k","kykykyk","kyyryyk","kkkkkkk"]);
  SPR.hat_buho = mkSprite({k:K,u:'#9d7bd8',y:'#ffd94a'},[
"...k...","..kuk..",".kuuuk.","kuyuyuk",".kkkkk."]);
}

const IC = {};
IC.feed = mkIcon(["..11111..",".1222221.","122222221","111111111","122222221",".1222221.","..11111..",".........","........."],'#3b2f2f','#f6d186');
IC.play = mkIcon(["..1111...",".122211..","12222211.","122111211","121222211","112222211",".1222211.","..11111..","........."],'#3b2f2f','#e2574c');
IC.clean= mkIcon([".......11","......11.",".....11..","....11...",".1111....","12221....","12221....",".111.....","........."],'#3b2f2f','#5ec8d8');
IC.sleep= mkIcon(["...111...","..11.....",".11......",".11......",".11......","..11.....","...111...",".........","........."],'#3b2f2f','#3b2f2f');
IC.shop = mkIcon([".1111111.","12222221.","111111111","12111121.","12111121.","12111121.","11111111.",".........","........."],'#3b2f2f','#ffd94a');
IC.stats= mkIcon([".......11","....11.11","....11.11",".11.11.11",".11.11.11",".11.11.11","111111111",".........","........."],'#3b2f2f','#3b2f2f');

let ESPR = {};
function buildEnemySprites(){
  ESPR.ratuco = mkSprite({k:K,m:'#a07850',w:'#ffffff'},[
"..kk......kk..",".kmmk....kmmk.",".kmmmkkkkmmmk.","kmmmmmmmmmmmmk","kmkwmmmmmmwkmk","kmmmmkwwkmmmmk","kmmmmmmmmmmmmk",".kmmmmmmmmmmk.","..kmmkmmkmmk..","..kk..kk..kk.."]);
  ESPR.pinchon = mkSprite({k:K,g:'#6aa84f',d:'#4a7838',w:'#ffffff'},[
"..k...kk...k..","...k.kggk.k...","..kkkggggkkk..",".kggggggggggk.","kgkwggggggwkgk","kggggggggggggk","kggggkkkkggggk","kggdggggggdggk",".kggggggggggk.","..kkkggggkkk..","...k.kggk.k...","..k...kk...k.."]);
  ESPR.lobruno = mkSprite({k:K,l:'#5a5464',d:'#3e3a4a',r:'#e8574c',w:'#ffffff'},[
".kk..........kk.",".kllk......kllk.",".klllkkkkkklllk.","kllllllllllllllk","klkrllllllllrklk","kllllllllllllllk","klkwkwkwkwkwkllk","kllllkkkkkkllllk","kllldllldllldllk",".kllllllllllllk.","..klldlldlldlk..","..kk.kk..kk.kk.."]);
  ESPR.sombrio = mkSprite({k:K,s:'#4a4460',r:'#e8574c',w:'#c8c0e0'},[
"....kkkkkk....","..kksssssskk..",".kssssssssssk.",".kskrssssrksk.","kssssssssssssk","ksskwkwkwkwssk","kssssssssssssk",".kssssssssssk.","..kssksskssk..","..ks..ks..sk..","..k....k....k."]);
}
