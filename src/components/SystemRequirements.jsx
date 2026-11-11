import { requirementRows, specRows } from '../showcase-data.js';

function RequirementIcon({ name }) {
  const paths = {
    os: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
    cpu: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3M10 10h4v4h-4z" /></>,
    ram: <><rect x="2" y="7" width="20" height="10" rx="1.5" /><path d="M6 17v3m4-3v3m4-3v3m4-3v3M6 11v3m3-3v3m3-3v3m3-3v3m3-3v3" /></>,
    gpu: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="9" cy="12" r="2.4" /><path d="M14 10h4v4h-4zM6 18v3" /></>,
    storage: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></>,
    architecture: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 7v10l9 5 9-5V7M12 12v10" /></>,
    internet: <><path d="M4.5 12.5a10.5 10.5 0 0 1 15 0M8 16a5.5 5.5 0 0 1 8 0" /><path d="M12 19h.01" /></>,
  };

  return (
    <svg className="requisitos__icono" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function SystemRequirements({ copy }) {
  const panels = [
    { id: 'minimum', title: copy.minimumTitle, eyebrow: copy.minimumEyebrow, note: copy.minimumNote },
    { id: 'recommended', title: copy.recommendedTitle, eyebrow: copy.recommendedEyebrow, note: copy.recommendedNote },
  ];

  return (
    <section id="requisitos" className="seccion requisitos" aria-labelledby="requisitos-titulo">
      <div className="seccion__cabecera requisitos__cabecera">
        <p className="seccion__numero">{copy.label}</p>
        <h2 className="seccion__titulo" id="requisitos-titulo">{copy.title}</h2>
        <p className="seccion__texto">{copy.subtitle}</p>
      </div>

      <p className="requisitos__ficha-titulo">{copy.specsLabel}</p>
      <div className="requisitos__ficha">
        {specRows.map((id) => {
          const item = copy.specs[id];
          return (
            <article className={`requisitos__dato requisitos__dato--${id}`} key={id}>
              <p className="requisitos__etiqueta">{item.label}</p>
              <p className="requisitos__valor">{item.value}</p>
              {item.note && <p className="requisitos__nota">{item.note}</p>}
            </article>
          );
        })}
      </div>

      <div className="requisitos__paneles">
        {panels.map((panel) => (
          <article className={`requisitos__panel requisitos__panel--${panel.id}`} key={panel.id}>
            <header className="requisitos__panel-cabecera">
              <span className="requisitos__panel-simbolo" aria-hidden="true">{panel.id === 'minimum' ? 'I' : 'II'}</span>
              <div>
                <p className="requisitos__panel-eyebrow">{panel.eyebrow}</p>
                <h3>{panel.title}</h3>
              </div>
            </header>
            <dl className="requisitos__lista">
              {requirementRows.map((row) => (
                <div className="requisitos__fila" key={row.id}>
                  <dt><RequirementIcon name={row.icon} />{copy.components[row.id]}</dt>
                  <dd>
                    <span className="requisitos__requisito">{copy.rows[row.id][panel.id]}</span>
                    <span className={`requisitos__estado requisitos__estado--${row.status}`}>{copy.statuses[row.status]}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="requisitos__panel-nota">{panel.note}</p>
          </article>
        ))}
      </div>

      <p className="requisitos__procedencia">{copy.sourceNote}</p>
    </section>
  );
}
