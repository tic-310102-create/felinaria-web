import imageMetadata from '../image-metadata.json';

export const imageURL = (name) => `${import.meta.env.BASE_URL}images/${name}`;

export function Imagen({ archivo, src, loading = 'lazy', ...props }) {
  return <img src={src ?? imageURL(archivo)} {...imageMetadata[archivo]} loading={loading} decoding="async" {...props} />;
}

export function SelectorIdioma({ language, changeLanguage, c }) {
  return (
    <div className="selector-idioma" role="group" aria-label={c.language.label}>
      {['es', 'en'].map((code) => (
        <button key={code} type="button" lang={code} aria-label={c.language[code]} aria-pressed={language === code} onClick={() => changeLanguage(code)}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
