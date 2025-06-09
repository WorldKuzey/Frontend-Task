import React, { useEffect, useState } from "react";
import axios from "axios";

function CharacterTable() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [species, setSpecies] = useState("");
  const [type, setType] = useState("");
  const [gender, setGender] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // Yeni: Sayfa başına gösterilecek karakter sayısı
  const [charactersPerPage, setCharactersPerPage] = useState(10);

  const [responseTime, setResponseTime] = useState(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const [episodesByCharacter, setEpisodesByCharacter] = useState({});
  const [expandedEpisode, setExpandedEpisode] = useState(null);
  const [charactersByEpisode, setCharactersByEpisode] = useState({});

  const [expandedLocationInfo, setExpandedLocationInfo] = useState({});
  const [locationDetailsCache, setLocationDetailsCache] = useState({});

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      setError(null);

      try {
        // Rick and Morty API sayfa başına 20 karakter döner
        // Biz front-end'de bunu charactersPerPage olarak dilimleyeceğiz
        // API sayfasını şu şekilde hesaplıyoruz:
        // Örn: currentPage = 1, charactersPerPage=10, API page=1
        // currentPage=3, charactersPerPage=10 => API sayfası = Math.ceil((3*10)/20)=2
        const apiPage = Math.ceil((currentPage * charactersPerPage) / 20);

        const params = {
          page: apiPage,
          name: name || undefined,
          status: status || undefined,
          species: species || undefined,
          type: type || undefined,
          gender: gender || undefined,
        };

        const startTime = performance.now();
        const response = await axios.get(
          "https://rickandmortyapi.com/api/character",
          { params }
        );
        const endTime = performance.now();

        setResponseTime((endTime - startTime).toFixed(2));

        // API'den gelen 20 karakterlik liste
        const apiCharacters = response.data.results || [];

        // Şimdi front-end'de gösterilecek karakterleri dilimle
        // currentPage baz alınarak, 1 tabanlı:
        // currentPage içindeki offset (index) hesapla:
        const startIndex = ((currentPage - 1) * charactersPerPage) % 20;
        const slicedCharacters = apiCharacters.slice(
          startIndex,
          startIndex + charactersPerPage
        );

        setCharacters(slicedCharacters);

        // Toplam sayfa = API sayfa sayısı * (20 / charactersPerPage)
        // Örnek: API sayfası = 34, charactersPerPage=10
        // totalPages = 34 * 20 / 10 = 68 sayfa (tahmini)
        const apiTotalPages = response.data.info.pages || 1;
        const total = Math.ceil((apiTotalPages * 20) / charactersPerPage);
        setTotalPages(total);

        setExpandedRow(null);
        setExpandedEpisode(null);
      } catch (err) {
        setCharacters([]);
        setTotalPages(1);
        setError("Veriler alınamadı.");
        setResponseTime(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [currentPage, name, status, species, type, gender, charactersPerPage]);

  // sayfa değiştirme fonksiyonu
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // karakter satırına tıklayınca detay bölümünü açma/kapatma
  const handleRowClick = async (char) => {
    if (expandedRow === char.id) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(char.id);
    setExpandedEpisode(null);

    if (!episodesByCharacter[char.id]) {
      try {
        const episodeRequests = char.episode.map((url) => axios.get(url));
        const responses = await Promise.all(episodeRequests);
        const episodes = responses.map((res) => res.data);
        setEpisodesByCharacter((prev) => ({ ...prev, [char.id]: episodes }));
      } catch (error) {
        console.error("Bölüm verisi alınamadı:", error);
        setEpisodesByCharacter((prev) => ({ ...prev, [char.id]: [] }));
      }
    }
  };

  const handleEpisodeClick = async (ep) => {
    if (expandedEpisode === ep.id) {
      setExpandedEpisode(null);
      return;
    }

    setExpandedEpisode(ep.id);

    if (!charactersByEpisode[ep.id]) {
      try {
        const characterIds = ep.characters.map((url) => url.split("/").pop());
        const idsParam = characterIds.join(",");
        const response = await axios.get(
          `https://rickandmortyapi.com/api/character/${idsParam}`
        );
        const data = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCharactersByEpisode((prev) => ({ ...prev, [ep.id]: data }));
      } catch (error) {
        console.error("Karakter verisi alınamadı:", error);
        setCharactersByEpisode((prev) => ({ ...prev, [ep.id]: [] }));
      }
    }
  };

  const handleLocationClick = async (loc, type, charId) => {
    if (!loc.url) return;

    const key = `${type}-${charId}`;
    if (expandedLocationInfo[key]) {
      setExpandedLocationInfo((prev) => ({ ...prev, [key]: false }));
      return;
    }

    if (!locationDetailsCache[loc.url]) {
      try {
        const res = await axios.get(loc.url);
        const data = res.data;
        const charactersRes = await axios.get(
          `https://rickandmortyapi.com/api/character/${data.residents
            .map((url) => url.split("/").pop())
            .join(",")}`
        );
        const residents = Array.isArray(charactersRes.data)
          ? charactersRes.data
          : [charactersRes.data];

        setLocationDetailsCache((prev) => ({
          ...prev,
          [loc.url]: { ...data, residents },
        }));
      } catch (err) {
        console.error("Konum verisi alınamadı", err);
        return;
      }
    }

    setExpandedLocationInfo((prev) => ({ ...prev, [key]: true }));
  };

  const renderPagination = () => {
    const pages = [];
    const visiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(visiblePages / 2), 2);
    let endPage = startPage + visiblePages - 1;

    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(endPage - visiblePages + 1, 2);
    }

    pages.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 border rounded ${
          currentPage === 1 ? "bg-blue-500 text-white" : "bg-white"
        }`}
      >
        1
      </button>
    );

    if (startPage > 2) {
      pages.push(
        <span key="start-ellipsis" className="px-2">
          ...
        </span>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded ${
            currentPage === i ? "bg-blue-500 text-white" : "bg-white"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="px-2">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 border rounded ${
            currentPage === totalPages ? "bg-blue-500 text-white" : "bg-white"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Rick and Morty Karakterleri</h1>

      {/* Filtreleme Alanları */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="İsim ile ara"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Durum (Tümü)</option>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
          <option value="unknown">Unknown</option>
        </select>

        <input
          type="text"
          placeholder="Tür ile ara"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Cinsiyet (Tümü)</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="genderless">Genderless</option>
          <option value="unknown">Unknown</option>
        </select>

        {/* Yeni: Sayfa başına karakter sayısı seçimi */}
        <select
          value={charactersPerPage}
          onChange={(e) => {
            setCharactersPerPage(Number(e.target.value));
            setCurrentPage(1); // karakter sayısı değişince sayfa 1 olur
          }}
          className="border p-2 rounded"
        >
          <option value={5}>Sayfa başına 5</option>
          <option value={10}>Sayfa başına 10</option>
          <option value={20}>Sayfa başına 20</option>
        </select>
      </div>

      {loading && <p>Yükleniyor...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mb-2 text-gray-600">
            API Yanıt Süresi: {responseTime} ms
          </p>

          <table className="table-auto border-collapse w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 cursor-pointer">ID</th>
                <th className="border px-4 py-2 cursor-pointer">Resim</th>
                <th className="border px-4 py-2 cursor-pointer">İsim</th>
                <th className="border px-4 py-2 cursor-pointer">Durum</th>
                <th className="border px-4 py-2 cursor-pointer">Tür</th>
                <th className="border px-4 py-2 cursor-pointer">Cinsiyet</th>
                <th className="border px-4 py-2 cursor-pointer">Detay</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((char) => (
                <React.Fragment key={char.id}>
                  <tr
                    onClick={() => handleRowClick(char)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">{char.id}</td>
                    <td className="border px-4 py-2">
                      <img
                        src={char.image}
                        alt={char.name}
                        className="w-12 h-12 rounded"
                      />
                    </td>
                    <td className="border px-4 py-2">{char.name}</td>
                    <td className="border px-4 py-2">{char.status}</td>
                    <td className="border px-4 py-2">{char.species}</td>
                    <td className="border px-4 py-2">{char.gender}</td>
                    <td className="border px-4 py-2 text-center">
                      {expandedRow === char.id ? "▲" : "▼"}
                    </td>
                  </tr>

                  {expandedRow === char.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="p-4">
                        <strong>Detaylar:</strong>
                        <p>
                          <strong>Son Lokasyon:</strong>{" "}
                          <button
                            className="underline text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(
                                char.location,
                                "location",
                                char.id
                              );
                            }}
                          >
                            {char.location.name}
                          </button>
                        </p>

                        {expandedLocationInfo[`location-${char.id}`] &&
                          locationDetailsCache[char.location.url] && (
                            <div className="mt-2 border p-2 rounded bg-white">
                              <p>
                                <strong>Lokasyon Türü:</strong>{" "}
                                {locationDetailsCache[char.location.url].type}
                              </p>
                              <p>
                                <strong>Lokasyon Boyutu:</strong>{" "}
                                {
                                  locationDetailsCache[char.location.url]
                                    .dimension
                                }
                              </p>
                              <p>
                                <strong>Rezidanlar:</strong>{" "}
                                {
                                  locationDetailsCache[char.location.url]
                                    .residents.length
                                }
                              </p>
                            </div>
                          )}

                        <p className="mt-3">
                          <strong>Doğum Yeri:</strong>{" "}
                          <button
                            className="underline text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(
                                char.origin,
                                "origin",
                                char.id
                              );
                            }}
                          >
                            {char.origin.name}
                          </button>
                        </p>

                        {expandedLocationInfo[`origin-${char.id}`] &&
                          locationDetailsCache[char.origin.url] && (
                            <div className="mt-2 border p-2 rounded bg-white">
                              <p>
                                <strong>Lokasyon Türü:</strong>{" "}
                                {locationDetailsCache[char.origin.url].type}
                              </p>
                              <p>
                                <strong>Lokasyon Boyutu:</strong>{" "}
                                {
                                  locationDetailsCache[char.origin.url]
                                    .dimension
                                }
                              </p>
                              <p>
                                <strong>Rezidanlar:</strong>{" "}
                                {
                                  locationDetailsCache[char.origin.url]
                                    .residents.length
                                }
                              </p>
                            </div>
                          )}

                        <div className="mt-4">
                          <strong>Bölümler:</strong>
                          <ul className="list-disc pl-5">
                            {(episodesByCharacter[char.id] || []).map((ep) => (
                              <li key={ep.id}>
                                <button
                                  className="underline text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEpisodeClick(ep);
                                  }}
                                >
                                  {ep.episode} - {ep.name}
                                </button>

                                {expandedEpisode === ep.id && (
                                  <ul className="list-disc pl-5 mt-2 border-l-2 border-gray-300">
                                    {(charactersByEpisode[ep.id] || []).map(
                                      (c) => (
                                        <li key={c.id}>
                                          {c.name} ({c.status})
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Önceki
            </button>

            {renderPagination()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharacterTable;
