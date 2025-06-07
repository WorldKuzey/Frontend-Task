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

  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page: currentPage,
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
        setCharacters(response.data.results);
        setTotalPages(response.data.info.pages);
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
  }, [currentPage, name, status, species, type, gender]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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

    // İlk sayfa
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

    // Başta ... gerekiyorsa
    if (startPage > 2) {
      pages.push(
        <span key="start-ellipsis" className="px-2 select-none">
          ...
        </span>
      );
    }

    // Ortadaki sayfalar
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

    // Sonda ... gerekiyorsa
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="px-2 select-none">
          ...
        </span>
      );
    }

    // Son sayfa
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
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        Rick and Morty Karakter Tablosu
      </h1>

      {/* 🔍 Filtre Alanları */}
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <input
          type="text"
          placeholder="İsme göre ara..."
          className="border px-3 py-2 rounded w-60"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="text"
          placeholder="Tür (species)..."
          className="border px-3 py-2 rounded w-60"
          value={species}
          onChange={(e) => {
            setSpecies(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="text"
          placeholder="Tip (type)..."
          className="border px-3 py-2 rounded w-60"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="border px-3 py-2 rounded w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          className="border px-3 py-2 rounded w-40"
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tüm Cinsiyetler</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="genderless">Genderless</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {responseTime && (
        <p className="text-center mb-4 text-gray-600">
          Son API çağrısı süresi: {responseTime} ms
        </p>
      )}

      {/* Tablo */}
      {loading ? (
        <p className="text-center">Yükleniyor...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">ID</th>
                  <th className="border p-2">Görsel</th>
                  <th className="border p-2">İsim</th>
                  <th className="border p-2">Durum</th>
                  <th className="border p-2">Tür</th>
                  <th className="border p-2">Tip</th>
                  <th className="border p-2">Cinsiyet</th>
                  <th className="border p-2">Origin</th>
                  <th className="border p-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {characters.map((char) => (
                  <tr key={char.id} className="hover:bg-gray-100">
                    <td className="border p-2">{char.id}</td>
                    <td className="border p-2">
                      <img
                        src={char.image}
                        alt={char.name}
                        className="w-12 h-12 rounded-full"
                      />
                    </td>
                    <td className="border p-2">{char.name}</td>
                    <td className="border p-2">{char.status}</td>
                    <td className="border p-2">{char.species}</td>
                    <td className="border p-2">{char.type || "—"}</td>
                    <td className="border p-2">{char.gender}</td>
                    <td className="border p-2">{char.origin.name}</td>
                    <td className="border p-2">{char.location.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ⬅️➡️ Pagination */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-gray-200 disabled:opacity-50"
            >
              ←
            </button>

            {renderPagination()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-gray-200 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharacterTable;
