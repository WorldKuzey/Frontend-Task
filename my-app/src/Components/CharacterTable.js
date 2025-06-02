import React, { useEffect, useState } from "react";
import axios from "axios";

function CharacterTable() {
  const [allCharacters, setAllCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [sortOrder, setSortOrder] = useState("name-az");

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [episodeNames, setEpisodeNames] = useState([]);

  // API'den tüm karakterleri çek
  const fetchAllCharacters = async () => {
    try {
      setLoading(true);
      const firstPage = await axios.get(
        "https://rickandmortyapi.com/api/character"
      );
      const total = firstPage.data.info.count;
      const pages = firstPage.data.info.pages;

      let allResults = [...firstPage.data.results];
      const requests = [];
      for (let i = 2; i <= pages; i++) {
        requests.push(
          axios.get(`https://rickandmortyapi.com/api/character?page=${i}`)
        );
      }

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        allResults = [...allResults, ...res.data.results];
      });

      setAllCharacters(allResults);
      setTotalPages(Math.ceil(allResults.length / pageSize));
      setError(null);
    } catch (err) {
      setAllCharacters([]);
      setError("Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCharacters();
  }, []);

  // Filtreleme + Sıralama
  const filteredData = allCharacters
    .filter(
      (char) =>
        char.name.toLowerCase().includes(name.toLowerCase()) &&
        (status === "" || char.status.toLowerCase() === status.toLowerCase()) &&
        (gender === "" || char.gender.toLowerCase() === gender.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        case "id-asc":
          return a.id - b.id;
        case "id-desc":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  const paginatedCharacters = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, pageSize]);

  const handleSelect = async (char) => {
    setSelectedCharacter(char);
    try {
      const episodes = char.episode.slice(0, 5);
      const requests = await Promise.all(episodes.map((url) => axios.get(url)));
      const names = requests.map((res) => res.data.name);
      setEpisodeNames(names);
    } catch (err) {
      setEpisodeNames(["Bölümler alınamadı."]);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Rick and Morty Karakterleri
      </h2>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <input
          type="text"
          placeholder="İsme göre ara..."
          value={name}
          onChange={(e) => {
            setCurrentPage(1);
            setName(e.target.value);
          }}
          className="border px-3 py-2 rounded w-60"
        />

        <select
          value={status}
          onChange={(e) => {
            setCurrentPage(1);
            setStatus(e.target.value);
          }}
          className="border px-3 py-2 rounded w-40"
        >
          <option value="">Tüm Durumlar</option>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          value={gender}
          onChange={(e) => {
            setCurrentPage(1);
            setGender(e.target.value);
          }}
          className="border px-3 py-2 rounded w-40"
        >
          <option value="">Tüm Cinsiyetler</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="genderless">Genderless</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border px-3 py-2 rounded w-40"
        >
          <option value="name-az">İsim A-Z</option>
          <option value="name-za">İsim Z-A</option>
          <option value="id-asc">ID Artan</option>
          <option value="id-desc">ID Azalan</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            const newSize = parseInt(e.target.value);
            setPageSize(newSize);
            setCurrentPage(1);
            setTotalPages(Math.ceil(filteredData.length / newSize));
          }}
          className="border px-3 py-2 rounded w-40"
        >
          <option value="10">10 karakter</option>
          <option value="20">20 karakter</option>
          <option value="30">30 karakter</option>
          <option value="50">50 karakter</option>
        </select>
      </div>

      {/* Hata */}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}

      {/* Tablo */}
      {!loading && paginatedCharacters.length > 0 && (
        <div className="overflow-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">ID</th>
                <th className="border p-2">İsim</th>
                <th className="border p-2">Durum</th>
                <th className="border p-2">Tür</th>
                <th className="border p-2">Tip</th>
                <th className="border p-2">Cinsiyet</th>
                <th className="border p-2">Origin</th>
                <th className="border p-2">Location</th>
                <th className="border p-2">Bölüm</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCharacters.map((char) => (
                <tr
                  key={char.id}
                  onClick={() => handleSelect(char)}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="border p-2">{char.id}</td>
                  <td className="border p-2">{char.name}</td>
                  <td className="border p-2">{char.status}</td>
                  <td className="border p-2">{char.species}</td>
                  <td className="border p-2">{char.type || "—"}</td>
                  <td className="border p-2">{char.gender}</td>
                  <td className="border p-2">{char.origin.name}</td>
                  <td className="border p-2">{char.location.name}</td>
                  <td className="border p-2">{char.episode.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p className="text-center mt-6">Yükleniyor...</p>}

      {/* Sayfalama */}
      {!loading && filteredData.length > 0 && (
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Detay */}
      {selectedCharacter && (
        <div className="mt-6 border rounded p-4 bg-white shadow-md max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Karakter Detayları</h3>
          <div className="flex gap-4 items-center flex-wrap">
            <img
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
              className="w-24 h-24 rounded"
            />
            <div>
              <p>
                <strong>İsim:</strong> {selectedCharacter.name}
              </p>
              <p>
                <strong>Lokasyon:</strong> {selectedCharacter.location.name}
              </p>
              <p>
                <strong>İlk Bölümler:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {episodeNames.map((ep, idx) => (
                  <li key={idx}>{ep}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterTable;
