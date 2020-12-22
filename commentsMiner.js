/*
      **********************************************************************************************************************************
      
          Run in the console within your target video.
          For best results, refresh video before running the script.
          Known Issues: 
               This will not download more than the first 1400 or so comments. I know why, but have not yet found a solution.
               Does not yet pull replies in comments.
      **********************************************************************************************************************************
*/
async function getCommentsOnVideo(){    
  var ele = (t) => document.createElement(t);
  var attr = (o, k, v) => o.setAttribute(k, v);
  var reChar = (s) => s.match(/&#.+?;/g) && s.match(/&#.+?;/g).length > 0 ? s.match(/&#.+?;/g).map(el=> [el,String.fromCharCode(/d+/.exec(el)[0])]).map(m=> s = s.replace(new RegExp(m[0], 'i'), m[1])).pop() : s;
  var a = (l, r) => r.forEach(a => attr(l, a[0], a[1]));
    function dateString(d){
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var date = new Date(d);
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    function processTimestampFromXAgo(str){
        const now = new Date().getTime();
        var timestamp_;
        const query = [{x:/year/i,t:3.154e+10},
        {x:/month/i,t:2.628e+9},
        {x:/week/i,t:6.048e+8},
        {x:/day/i,t:8.64e+7},
        {x:/hour/i,t:3.6e+6},
        {x:/minute/i,t:60000},
        {x:/second/i,t:1000},
        {x:/just.+?now/i,t:1}]
        for(let i=0; i<query.length; i++){
            if(query[i].x.test(str)) {
                return dateString((now - (/\d/.test(str) ? parseInt(str.replace(/\D+/g,'')) * query[i].t : 0)));
            }
        }
    }
     function convert2TsvAndDownload(records, named_file){
      var fileArray = records;
      var tsvReady = (s) => s ? s.replace(/\t|\u0009|&#9;/g, ' ').replace(/[\r\n]+/g, '↵').replace(/\u2029|\u2028|\x85|\x1e|\x1d|\x1c|\x0c|\x0b/g,'↵').replace(/"/g, "'") : s;
      var unqHsh = (a, o) => a.filter(i => o.hasOwnProperty(i) ? false : (o[i] = true));
      var unq = (arr) => arr.filter((e, p, a) => a.indexOf(e) == p);
      var str = (o) => typeof o == 'object' ? tsvReady(JSON.stringify(o).replace(/\n|\r/g, ' ')) : o;
      var firstLevel = fileArray.map(el => Object.entries(el));
      var header = unqHsh(firstLevel.map(el => el.map(itm => itm[0])).flat(),{});
      var table = [header];
      for (let i = 0; i < firstLevel.length; i++) {
        var arr = [];
        var row = [];
        var record = firstLevel[i];
        for (var s = 0; s < record.length; s++) {
          var record_kv = record[s];
          var col_key = record_kv[0];      
          var place = header.indexOf(col_key);
          arr[place] = record_kv[1];
        }
        for (var a = 0; a < arr.length; a++) {
          if (arr[a]) {
            row.push(arr[a]);
          } else {
            row.push('');
          }
        }
        table.push(row);
      }
      function downloadr(arr2D, filename) {
        var data = /\.json$|.js$/.test(filename) ? JSON.stringify(arr2D) : arr2D.map(el => el.reduce((a, b) => a + '\t' + b)).reduce((a, b) => a + '\r' + b);
        var type = /\.json$|.js$/.test(filename) ? 'data:application/json;charset=utf-8,' : 'data:text/plain;charset=utf-8,';
        var file = new Blob([data], {
          type: type
        });
        if (window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(file, filename);
        } else {
          var a = document.createElement('a'),
            url = URL.createObjectURL(file);
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 10);
        }
      }
      var output_ = table.map(el => el.map(itm => str(itm)));
      downloadr(output_, named_file);
    }
    async function handleFetch(url,params_obj,type){ //all arguments are required
        const rando = (n) => Math.round(Math.random() * n);
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        async function handleResponse(res,type){
            if(type == 'json') {return await res.json().catch(err=> { console.log([err,url,params_obj]); return false });}
            if(type == 'text') {return await res.text().catch(err=> { console.log([err,url,params_obj]); return false });}
            if(type == 'html') {
                let text = await res.text().catch(err=> { console.log([err,url,params_obj]); return false }); 
                return new DOMParser().parseFromString(text,'text/html');
            }else{ return false }
        }
        if(params_obj && url){
            var res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return false });
            if(res.status > 199 && res.status < 300) {return await handleResponse(res,type);}

            if(res.status == 429) {
                await delay(300000);
                let res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return false });
                if(res.status > 199 && res.status < 300) {return await handleResponse(res,type);}
                else {return {action: 'stop', status: res.status};}
            }
            if(res.status > 399 && res.status < 900){
                await delay(rando(4444)+4410);
                let res = await fetch(url,params_obj).catch(err=> { console.log([err,url,params_obj]); return false });
                if(res.status > 199 && res.status < 300) {
                    return await handleResponse(res,type);
                } else {return {action: 'stop', status: res.status};}
            }
            if(res.status > 899) {return {action: 'stop', status: res.status};}
        } else {return false;}
    }
    function getYouTubeTokens(){
        const reg = (o, n) => o ? o[n] : '';
        return {
            continuation: encodeURIComponent(reg(/(?<=\{\"continuation\"\:\").+?(?=")/i.exec(document.body.innerHTML),0)),
            click_tracking: encodeURIComponent(reg(/(?<=\{\"continuation\"\:\"\S+?"clickTrackingParams":").+?(?=")/i.exec(document.body.innerHTML),0)),
            xsrf_token: reg(/(?<=\"XSRF_TOKEN\"\:\").+?(?=")/i.exec(document.head.innerHTML),0).replace(/\\u003d/g,'%3D'),
            id_token: reg(/(?<=\"ID_TOKEN\"\:\").+?(?=")/i.exec(document.head.innerHTML),0).replace(/\\u003d/g,'='),
            page_label: reg(/(?<=\"PAGE_BUILD_LABEL\"\:\").+?(?=")/i.exec(document.head.innerHTML),0).replace(/\\u003d/g,'='),
            page_cl: reg(/(?<=\"PAGE_CL\"\:)\d+/i.exec(document.head.innerHTML),0),
        }
    }
    async function getComments(obj){
        const {continuation,click_tracking,xsrf_token,id_token,page_label,page_cl} = {...getYouTubeTokens(),...obj};
        const d = await handleFetch(`https://www.youtube.com/comment_service_ajax?action_get_comments=1&pbj=1&ctoken=${continuation}&continuation=${continuation}&itct=${click_tracking}`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-data": "",
        "x-spf-previous": window.location.href,
        "x-spf-referer": window.location.href,
        "x-youtube-ad-signals": "dt="+new Date().getTime(),
        "x-youtube-client-name": "1",
        "x-youtube-client-version": "2.20201220.08.00",
        "x-youtube-device": "cbr=Chrome",
        "x-youtube-identity-token": id_token,
        "x-youtube-page-cl": page_cl,
        "x-youtube-page-label": page_label,
        "x-youtube-time-zone": "America/New_York",
        "x-youtube-utc-offset": "-300"
      },
      "referrer": "https://www.youtube.com/watch?v=v9Jvf1vLZzE",
      "referrerPolicy": "origin-when-cross-origin",
      "body": "session_token="+xsrf_token,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    },'json');
/*
TODO: need a function to handle time-offset for global users. Need to identify the Google Location Strings, e.g., "America/New York"
(-(new Date().getTimezoneOffset())).toString()
*/
        if(d && d.response){
        const reply_context = getCommentRepliesContinuationContext(d);
        const comments = parseCommentResponse(d);
        return {...comments,...{reply_context: reply_context, video_title: d.response?.continuationContents?.itemSectionContinuation?.contents[0].commentThreadRenderer?.commentTargetTitle?.simpleText,total_comments:parseInt(d?.response?.continuationContents?.itemSectionContinuation?.header?.commentsHeaderRenderer?.countText?.runs[0].text.replace(/\D+/g,''))}};
        }else{ return false; }
    }


    function parseCommentResponse(d){
        const tsvReady = (s) => s ? s?.replace(/\t|\u0009|&#9;/g, ' ').replace(/[\r\n]+/g, ' _ ').replace(/\u2029|\u2028|\x85|\x1e|\x1d|\x1c|\x0c|\x0b/g,' _ ').replace(/"/g, "'") : s;
        const content = d.response?.continuationContents?.itemSectionContinuation || d.response?.continuationContents?.commentRepliesContinuation;
        return {
            comments: content.contents.map(comment=> comment.commentThreadRenderer || comment).map(thread=> {
                let comment = thread?.comment || thread;
                let txt = comment?.commentRenderer?.contentText?.runs?.map(text=> text.text);
                return {
                    video_url: window.location.href,
                    author_name: tsvReady(comment?.commentRenderer?.authorText?.simpleText),
                    author_channel: comment?.commentRenderer?.authorEndpoint?.browseEndpoint?.canonicalBaseUrl ? 'https://www.youtube.com'+comment?.commentRenderer?.authorEndpoint?.browseEndpoint?.canonicalBaseUrl : '',
                    text: txt?.length ? tsvReady(txt.reduce((a,b)=> a+' '+b)) : '',
                    num_likes: comment?.commentRenderer?.likeCount ? comment?.commentRenderer?.likeCount : 0,
                    num_replies: comment?.commentRenderer?.replyCount ? comment?.commentRenderer?.replyCount : 0,
                    author_img: comment?.commentRenderer?.authorThumbnail?.thumbnails[comment?.commentRenderer?.authorThumbnail?.thumbnails.length-1].url,
                    comment_date: comment?.commentRenderer?.publishedTimeText?.runs?.length ? processTimestampFromXAgo(comment?.commentRenderer?.publishedTimeText?.runs?.map(r=> r?.text)[0]) : '',
                    comment_id: comment?.commentRenderer?.commentId,
                }
            }),
            continuation: content.continuations && content.continuations[0] && content.continuations[0].nextContinuationData ? content.continuations[0].nextContinuationData.continuation : null,
            click_tracking: content.continuations && content.continuations[0] && content.continuations[0].nextContinuationData ? content.continuations[0].nextContinuationData.clickTrackingParams : null,
        }
    }
    function getCommentRepliesContinuationContext(d){
        const tsvReady = (s) => s ? s?.replace(/\t|\u0009|&#9;/g, ' ').replace(/[\r\n]+/g, ' _ ').replace(/\u2029|\u2028|\x85|\x1e|\x1d|\x1c|\x0c|\x0b/g,' _ ').replace(/"/g, "'") : s;
        return d?.response?.continuationContents?.itemSectionContinuation?.contents?.map(content=> {
            let render = content?.commentThreadRenderer;
            let replies = render?.replies?.commentRepliesRenderer;
            let continuations = replies?.continuations && replies?.continuations[0] && replies?.continuations[0].nextContinuationData;
            let txt = render?.comment?.commentRenderer?.contentText?.runs?.map(text=> text.text);
            return {
                num_replies: render?.comment?.commentRenderer?.replyCount ? render?.comment?.commentRenderer?.replyCount : 0,
                comment_replied_to_text: txt?.length ? tsvReady(txt.reduce((a,b)=> a+' '+b)) : '',
                comment_replied_to_id: render?.comment?.commentRenderer?.commentId,
                click_tracking: continuations?.clickTrackingParams ? encodeURIComponent(continuations?.clickTrackingParams) : '',
                continuation: continuations?.continuation ? encodeURIComponent(continuations?.continuation) : '',
            };
        })
    }

    async function loopThroughComments(){
        function unqKey(array,key){  var q = [];  var map = new Map();  for (const item of array) {    if(!map.has(item[key])){        map.set(item[key], true);        q.push(item);    }  }  return q;}
        createDownloadHTML();
        const everyNth = (i,n) => /\./.test((i/n).toString()) === false && i != 0;
        const reg = (o, n) => o ? o[n] : '';
        const rando = (n) => Math.round(Math.random() * n);
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        const first = await getComments({});
        const total_comments = first.total_comments;
        var continuation = first.continuation;
        var click_tracking = first.click_tracking;
        const contain_arr = [first.comments];
        const replies_container = [first.reply_context];
        for(let i=0; i<total_comments; i=i+20){
            let comments = await getComments({click_tracking:click_tracking,continuation:continuation});
            if(comments){
                continuation = comments.continuation;
                click_tracking = comments.click_tracking;
                await delay(rando(333)+333);
                contain_arr.push(comments.comments);
                replies_container.push(comments.reply_context);
                updateDownloadBar({text:' seconds remaining.',seconds_offset:1.91,iteration:i,total_results:total_comments,status:true});
                if(everyNth(i,200)) {await delay(rando(1333)+1333); console.log(i)}
            }else{
                break;
            }
        }
        const replies = await loopThroughReplies(replies_container.flat().filter(r=> r.num_replies > 0),total_comments,contain_arr.flat().length);
        const output = [...contain_arr.flat(),...replies];
        updateDownloadBar({text:'',seconds_offset:0.5,iteration:100,total_results:100,status:false});
        return {file: output,filename:first.video_title.replace(/\./g,' ').trim()};
    }
    async function loopThroughReplies(arr,total_comments,progress){
        const everyNth = (i,n) => /\./.test((i/n).toString()) === false && i != 0;
        const contain_arr = [];
        var continuation;
        var click_tracking;
        for(let i=0; i<arr.length; i++){
            let reply_context = {comment_replied_to_id: arr[i].comment_replied_to_id,comment_replied_to_text:arr[i].comment_replied_to_text};
            let comments = await getComments({click_tracking:arr[i].click_tracking,continuation:arr[i].continuation});
            if(comments){
                comments.comments?.forEach(comment=> contain_arr.push({...comment,...reply_context}));
                if(comments.num_replies > 20){
                    console.log(['comments.num_replies',comments.num_replies]);
                    continuation = comments.continuation;
                    click_tracking = comments.click_tracking;
                    for(let r=0; r<comments.num_replies; r=r+20){
                        let replies = await getComments({click_tracking:click_tracking,continuation:continuation});
                        if(replies){
                            replies.comments?.forEach(comment=> contain_arr.push({...comment,...reply_context}));
                            continuation = replies.continuation;
                            click_tracking = replies.click_tracking;
                            await delay(rando(333)+333);
                        }else{ break; } 
                    }
                }
                if(everyNth(i,200)) await delay(rando(2333)+1333);
            }else{
                break;
            }
            updateDownloadBar({text:' seconds remaining.',seconds_offset:1.91,iteration:(progress+i),total_results:total_comments,status:true});

        }
        return contain_arr;
    }


    function createDownloadHTML() {
        const gi = (o, s) => o ? o.getElementById(s) : null;
        if(gi(document,'downloading_notifier')) gi(document,'downloading_notifier').outerHTML = '';
        const body_width = document.body.getBoundingClientRect().width;
        const download_bar_width = body_width * 0.8;
        let cont = ele('div');
        a(cont, [['id', 'downloading_notifier'], ['style', `position: fixed; top: 100px; left: ${((body_width - download_bar_width)/2)}px; width: ${download_bar_width}px; z-index: ${new Date().getTime()}; background: #121212; border: 1px solid #3de367; border-radius: 0.2em;`]]);
        document.body.appendChild(cont);
        let perc = ele('div');
        a(perc, [['id', 'downloading_percentage_bar'], ['style', `width: 0px; height: 50px; background: #3de367; border: 1px solid #3de367; border-bottom-right-radius: 0.2em; border-top-right-radius: 0.2em; transition: all 1s;`]]);
        cont.appendChild(perc);
        let txt = ele('div');
        a(txt, [['id', 'downloading_percentage_txt'], ['style', `float: left; padding: 14px; color: #fff; width: ${download_bar_width}px;`]]);
        perc.appendChild(txt);
        txt.innerText = 'initiating download...';
    }
    function updateDownloadBar(obj){
        const gi = (o, s) => o ? o.getElementById(s) : null;
        const {text,seconds_offset,iteration,total_results,status} = obj;
        const body_width = document.body.getBoundingClientRect().width;
        const download_bar_width = body_width * 0.8;
        let cont = gi(document,'downloading_notifier');
        let perc = gi(document,'downloading_percentage_bar');
        let txt = gi(document,'downloading_percentage_txt');
        perc.style.width = `${( download_bar_width * ( iteration / total_results ) )}px`;
        perc.style.background = iteration % 2 == 0 ? '#07ba5b' : '#3de367';
        txt.innerText = `${Math.ceil( ( iteration / total_results ) * 100)}% complete ~ ${Math.round( ( ( ( ( total_results - iteration ) / 100 ) * seconds_offset ) / 60 ) * 100 )} ${text}`;
        if(status !== true) {cont.outerHTML = '';}
    }
    const all_comments = await loopThroughComments();
    convert2TsvAndDownload(all_comments.file,`${all_comments.filename}.tsv`);

}
getCommentsOnVideo()
