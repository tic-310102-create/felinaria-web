import { teamMembers } from '../showcase-data.js';

export default function DevelopmentTeam({ copy }) {
  return (
    <section id="equipo" className="seccion equipo" aria-labelledby="equipo-titulo">
      <div className="seccion__cabecera equipo__cabecera">
        <p className="seccion__numero">{copy.label}</p>
        <h2 className="seccion__titulo" id="equipo-titulo">{copy.title}</h2>
        <p className="seccion__texto">{copy.subtitle}</p>
        <p className="equipo__conteo">{copy.count}</p>
      </div>

      <div className="equipo__rejilla">
        {teamMembers.map((member, index) => {
          const info = copy.members[member.id];
          return (
            <article className="equipo__tarjeta" key={member.id}>
              <div className="equipo__cabecera-tarjeta">
                <span className="equipo__numero" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="equipo__iniciales" aria-hidden="true">{member.initials}</span>
              </div>
              <h3 className="equipo__nombre">{info.name}</h3>
              <p className="equipo__rol">{info.role}</p>
              <span className="equipo__filete" aria-hidden="true" />
              <div className="equipo__responsabilidades">
                {member.groups.map((groupId) => (
                  <div className="equipo__grupo" key={groupId}>
                    {copy.groupLabels[groupId] && <p className="equipo__grupo-titulo">{copy.groupLabels[groupId]}</p>}
                    <ul className="equipo__lista">
                      {info.groups[groupId].map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
