'use strict';

function addClassLang(e, result) {
  let langs = result && result.languages.length ? ' ' : ' und';
  for (let i = 0; i < result.languages.length; ++i) {
    langs += ' ' + result.languages[i].language;
  }
  let reliableClass = 'reliable';
  e.setAttribute('class', e.getAttribute('class') + ' filtered ' + langs + ' ' + (result.isReliable ? reliableClass : ''));
}

function addClassToCmt(comments, checked){
  let e = comments.querySelectorAll('.ytd-comment-thread-renderer:not(.filtered)');
  for(let i = 0; i < e.length; ++i){
    const _e = e[i];
    const txt = _e.querySelector('yt-formatted-string#content-text');
    if (txt) {
      chrome.i18n.detectLanguage(
        txt.innerText,
        (result) => { addClassLang(_e, result); }
      );
    }
  }
  // double check
  if (!checked) {
    setTimeout(addClassToCmt.bind(null, comments, true), 500);
  }
}

function setup(){
  let target = document.querySelector('ytd-item-section-renderer#sections');
  if (!target) {
    setTimeout(setup, 1000);
    return;
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) { 
      setTimeout(addClassToCmt.bind(null, mutation.target, false), 10);
    });
  });

  var config = { 
    attributes: true,
    childList: true,
    characterData: true
  };

  observer.observe(target, config);

  injectUI(target);
}

function injectUI(container){
  let path = chrome.extension.getURL('css/style.css');
  let css = document.createElement('link');
  css.setAttribute('rel', 'stylesheet');
  css.setAttribute('type', 'text/css');
  css.setAttribute('href', path);
  document.getElementsByTagName('head')[0].appendChild(css);

  let tmpCss = document.createElement('style');
  tmpCss.setAttribute('id', 'ytcf-css');
  document.getElementsByTagName('head')[0].appendChild(tmpCss);

  let wrapper = document.createElement('div');
  wrapper.setAttribute('class', 'ytcf-wrapper');

  wrapper.appendChild(createButtonEnable(container));
  wrapper.appendChild(createSelectLangs());
  
  let title = document.createElement('div');
  title.setAttribute('class', 'ytcf-label');
  title.innerText = 'Enable Language Filter';
  wrapper.appendChild(title);

  container.insertBefore(wrapper, container.firstChild);
}

function createButtonEnable(container) {
  let node = document.createElement('div');

  let swt = document.createElement('div');
  swt.setAttribute('class', 'ytcf-switch');

  let inp = document.createElement('input');
  inp.setAttribute('id', 'ytcf-switch');
  inp.setAttribute('type', 'checkbox');
  inp.setAttribute('class', 'ytcf-switch-input');
  inp.addEventListener('change', function(e){
    if (e.target.checked) {
      container.classList.add('ytcf-enabled');
    } else {
      container.classList.remove('ytcf-enabled');
    }
  }, false);

  let lab = document.createElement('label');
  lab.setAttribute('for', inp.id);
  lab.setAttribute('class', 'ytcf-switch-label');
  swt.appendChild(inp);
  swt.appendChild(lab);
  node.appendChild(swt);

  return node;
}

function createSelectLangs(wrapper) {
  let node = document.createElement('div');
  node.setAttribute('class', 'ytcf-select');

  let select = document.createElement('select');
  select.appendChild(document.createElement('option'));
  let langCodes = Object.keys(i18nLanguages.asDict);
  langCodes.sort(function(x, y){
    return ('' + i18nLanguages.asDict[x].attr).localeCompare(i18nLanguages.asDict[y].attr);
  });
  for(let i = 0; i < langCodes.length; ++i) {
    let opt = document.createElement('option');
    opt.setAttribute('value', langCodes[i]);
    opt.innerText = i18nLanguages.asDict[langCodes[i]];
    select.appendChild(opt);
  }
  select.addEventListener('change', function(evt){
    let style = document.getElementById('ytcf-css');
    let langClass = evt.target.value ? '.' + evt.target.value : '';
    style.innerText = '.ytd-comment-thread-renderer' + langClass + '{display:block!important;}';
  });
  node.appendChild(select);

  return node;
}

(function(){
  setup();
})();