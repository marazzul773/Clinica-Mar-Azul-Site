// Dados do site (produtos e posts/artigos)
const products = [
  { slug: 'power-ditox', name: 'Power Ditox', price: 5000, details: 'Disparasitante natural, relaxante, antibacteriana.' },
  { slug: 'hbrc', name: 'HBRC', price: 15000, details: 'Tónico antioxidante, anti-inflamatório, limpeza no fígado e no sangue.' },
  { slug: 'carvao-ativado', name: 'Carvão Ativado', price: 5000, details: 'Anti-veneno, limpeza intestinal.' },
  { slug: 'respeito-do-casamento', name: 'Respeito do Casamento', price: 20000, details: 'Trata impotência sexual, ejaculação precoce, infertilidade, frigidez.' },
  { slug: 'digee-yogue', name: 'Digee Yogue', price: 15000, details: 'Trata desordens gastrointestinais.' },
  { slug: 'capsulas-de-ginseng', name: 'Cápsulas de Ginseng', price: 30000, details: 'Aumenta o desempenho físico e mental.' },
  { slug: 'cuidados-menstruais', name: 'Cuidados Menstruais', price: 10000, details: 'Reduz cólicas abdominais e menstruais.' },
  { slug: 'cafe-do-homem', name: 'Café do Homem', price: 15000, details: 'Aumenta o desempenho sexual.' },
  { slug: 'memoria-duradoura', name: 'Memória Duradoura', price: 15000, details: 'Auxilia no tratamento de demência e doenças mentais.' },
  { slug: 'unha-de-gato', name: 'Unha de Gato', price: 5000, details: 'Anti-inflamatório; auxilia em rinite, bursite, amigdalite, sinusite, digestivo e reprodutor feminino.' },
  { slug: 'uxi-amarelo', name: 'Uxi Amarelo', price: 5000, details: 'Miomas, quistos uterinos, infeções urinárias e inflamações.' },
  { slug: 'saude-do-homem', name: 'Saúde do Homem', price: 5000, details: 'Tratamento do sistema urogenital masculino.' }
];

// podes começar com posts vazios e ir adicionando depois
const posts = [
  // { slug:'beneficios-detox', title:'Benefícios da desintoxicação natural', excerpt:'Como a desintoxicação auxilia o corpo...', content:'...' }
];

module.exports = { products, posts };
