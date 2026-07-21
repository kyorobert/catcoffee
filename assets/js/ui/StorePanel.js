export class StorePanel{
  constructor(element,furnitureConfig,saveAdapter,onPlace){
    this.element=element;
    this.furniture=furnitureConfig;
    this.saveAdapter=saveAdapter;
    this.onPlace=onPlace;
    this.category='全部';
    this.bind();
  }
  bind(){
    this.element.querySelector('[data-close]')?.addEventListener('click',()=>this.close());
  }
  open(){this.element.classList.remove('hidden');this.render()}
  close(){this.element.classList.add('hidden')}
  render(){
    const categories=['全部',...new Set(Object.values(this.furniture).map(item=>item.cat))];
    const tabs=this.element.querySelector('[data-store-tabs]');
    tabs.innerHTML=categories.map(category=>`<button class="${category===this.category?'active':''}" data-category="${category}">${category}</button>`).join('');
    tabs.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{this.category=button.dataset.category;this.render()}));
    const state=this.saveAdapter.state;
    const catalog=this.element.querySelector('[data-store-catalog]');
    const entries=Object.entries(this.furniture).filter(([,item])=>this.category==='全部'||item.cat===this.category);
    catalog.innerHTML=entries.map(([id,item])=>`
      <button class="store-card" data-id="${id}">
        <span class="owned">倉庫 ${state.inventory[id]||0}</span>
        <img src="${item.texture}" alt="${item.name}">
        <b>${item.name}</b>
        <small>🪙 ${Number(item.price||0).toLocaleString('zh-TW')} · ${item.foot.join('×')}</small>
      </button>`).join('');
    catalog.querySelectorAll('.store-card').forEach(card=>card.addEventListener('click',()=>{
      this.onPlace(card.dataset.id);
      this.close();
    }));
  }
}

